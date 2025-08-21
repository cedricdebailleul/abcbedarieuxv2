import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Prisma } from "@/lib/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user?.role || !["admin", "moderator", "editor"].includes(user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const verified = searchParams.get("verified");
    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: Prisma.NewsletterSubscriberWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (verified === "verified") {
      where.isVerified = true;
    } else if (verified === "unverified") {
      where.isVerified = false;
    }

    try {
      // Récupérer les abonnés
      const [subscribers, totalCount] = await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where,
          skip,
          take: limit,
          orderBy: { subscribedAt: "desc" },
          include: {
            preferences: true,
          },
        }),
        prisma.newsletterSubscriber.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        success: true,
        subscribers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch {
      // Si les modèles n'existent pas encore
      return NextResponse.json({
        success: true,
        subscribers: [],
        pagination: {
          page: 1,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        migrationRequired: true,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnés:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user?.role || !["admin", "moderator", "editor"].includes(user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, firstName, lastName, preferences = {} } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: "L'email est requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    try {
      const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email },
      });

      if (existingSubscriber) {
        return NextResponse.json(
          { error: "Cet email est déjà abonné" },
          { status: 400 }
        );
      }

      // Créer les tokens
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const unsubscribeToken = crypto.randomBytes(32).toString("hex");

      // Créer l'abonné
      const subscriber = await prisma.newsletterSubscriber.create({
        data: {
          email,
          firstName,
          lastName,
          verificationToken,
          unsubscribeToken,
          isActive: true,
          isVerified: true, // Auto-vérifié quand ajouté par admin
          preferences: {
            create: {
              events: preferences.events ?? true,
              places: preferences.places ?? true,
              offers: preferences.offers ?? false,
              news: preferences.news ?? true,
              frequency: preferences.frequency ?? "WEEKLY",
            },
          },
        },
        include: {
          preferences: true,
        },
      });

      return NextResponse.json({
        success: true,
        subscriber,
        message: "Abonné ajouté avec succès",
      });
    } catch (prismaError) {
      if (
        prismaError instanceof Error &&
        typeof prismaError.message === "string" &&
        prismaError.message.includes("newsletterSubscriber")
      ) {
        return NextResponse.json(
          {
            error:
              "Les tables de newsletter ne sont pas encore créées. Veuillez exécuter la migration.",
            migrationRequired: true,
          },
          { status: 500 }
        );
      }
      throw prismaError;
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'abonné:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
