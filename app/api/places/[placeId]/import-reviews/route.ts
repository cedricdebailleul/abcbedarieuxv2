// app/api/places/[placeId]/import-reviews/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { env } from "@/lib/env";

type GoogleReviewV1 = {
  rating?: number;
  text?: { text?: string; languageCode?: string };
  originalText?: { text?: string; languageCode?: string };
  publishTime?: string; // ISO
  authorAttribution?: { displayName?: string; uri?: string };
};

function stableGoogleReviewId(
  googlePlaceId: string,
  author: string,
  publishTime: string | number
) {
  const key = `${googlePlaceId}#${author.trim().toLowerCase()}#${publishTime}`;
  return crypto.createHash("sha1").update(key).digest("hex");
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: {
        id: true,
        ownerId: true,
        name: true,
        googlePlaceId: true,
      },
    });
    if (!place) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
    }

    const isOwner = place.ownerId === session.user.id;
    const isAdmin = safeUserCast(session.user).role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    if (!place.googlePlaceId || !place.googlePlaceId.trim()) {
      return NextResponse.json(
        {
          error:
            "Aucun googlePlaceId associé à cette place. Liez d'abord la fiche à Google.",
        },
        { status: 400 }
      );
    }

    // Utilise de préférence la clé serveur; fallback sur la publique si nécessaire.
    const API_KEY =
      process.env.GOOGLE_MAPS_API_KEY || env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_MAPS_API_KEY manquant" },
        { status: 500 }
      );
    }

    // v1 details endpoint — pas de reviews* dans l’URL, on contrôle via FieldMask
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
      place.googlePlaceId
    )}?languageCode=fr`;

    // Demander des champs « feuilles » sinon 502/erreurs
    const fieldMask = [
      "id",
      "rating",
      "userRatingCount",
      "reviews.rating",
      "reviews.text.text",
      "reviews.originalText.text",
      "reviews.publishTime",
      "reviews.authorAttribution.displayName",
      "reviews.authorAttribution.uri",
    ].join(",");

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": fieldMask,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Google Places v1 error:", res.status, txt);
      return NextResponse.json(
        { error: "Échec récupération avis Google", details: txt },
        { status: 502 }
      );
    }

    const details = await res.json();
    const reviews: GoogleReviewV1[] = Array.isArray(details?.reviews)
      ? details.reviews
      : [];

    if (!reviews.length) {
      return NextResponse.json({
        success: true,
        message: "Aucun avis retourné par l'API Google",
        imported: 0,
        skipped: 0,
        errors: [],
      });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const rev of reviews) {
      const author = rev.authorAttribution?.displayName || "Utilisateur Google";

      // Privilégier le texte traduit; fallback sur l’original
      const comment =
        rev.text?.text?.trim() ?? rev.originalText?.text?.trim() ?? null;

      const rating = Number.isFinite(rev.rating) ? (rev.rating as number) : 0;
      const iso = rev.publishTime || new Date().toISOString();
      const unix = Math.floor(new Date(iso).getTime() / 1000);

      const googleReviewId = stableGoogleReviewId(
        place.googlePlaceId,
        author,
        unix
      );

      const exists = await prisma.googleReview.findUnique({
        where: { googleReviewId },
        select: { id: true },
      });
      if (exists) {
        skipped++;
        continue;
      }

      try {
        await prisma.googleReview.create({
          data: {
            placeId: place.id,
            rating: rating || 5,
            comment,
            googleReviewId,
            authorName: author,
            authorUrl: rev.authorAttribution?.uri || null,
            googleTime: unix,
            relativeTime: null,
            status: "APPROVED",
          },
        });
        imported++;
      } catch (e) {
        console.error("create googleReview error:", e);
        errors.push(
          `Erreur pour ${author} (${googleReviewId}): ${
            e instanceof Error ? e.message : "Erreur inconnue"
          }`
        );
      }
    }

    // Recalcule rapide : moyenne + total (GoogleReview APPROVED + Review APPROVED)
    const [grAgg, rAgg] = await Promise.all([
      prisma.googleReview.aggregate({
        where: { placeId, status: "APPROVED" },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.review.aggregate({
        where: { placeId, status: "APPROVED" },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const totalCount = (grAgg._count.id ?? 0) + (rAgg._count.id ?? 0);
    const avg =
      totalCount > 0
        ? ((grAgg._avg.rating ?? 0) * (grAgg._count.id ?? 0) +
            (rAgg._avg.rating ?? 0) * (rAgg._count.id ?? 0)) /
          totalCount
        : 0;

    await prisma.place.update({
      where: { id: placeId },
      data: { rating: avg || 0, reviewCount: totalCount },
    });

    return NextResponse.json({
      success: true,
      message: `Import terminé: ${imported} avis importés, ${skipped} ignorés`,
      imported,
      skipped,
      errors,
    });
  } catch (err) {
    console.error("Erreur import avis:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
