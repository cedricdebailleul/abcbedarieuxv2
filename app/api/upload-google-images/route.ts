import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { saveFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions
    const userRole = safeUserCast(session.user).role;
    if (!userRole || !["admin", "editor", "user"].includes(userRole)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { images, slug, type = "places", imageType } = body;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Aucune image fournie" },
        { status: 400 }
      );
    }

    const sanitize = (s: string) =>
      s.replace(/[^a-z0-9-_]/gi, "").toLowerCase();
    const cleanSlug = sanitize(slug);
    const cleanType = sanitize(type);

    // Déterminer si c'est une image de galerie
    const isGalleryImage = !imageType || imageType === "gallery";

    const uploadedImages: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];

      try {
        // Télécharger l'image
        const response = await fetch(imageUrl);
        if (!response.ok) {
          errors.push(`Erreur téléchargement ${imageUrl}: ${response.status}`);
          continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        // Vérifier que c'est une image
        const metadata = await sharp(buffer).metadata();
        if (!metadata.format) {
          errors.push(`Format non supporté: ${imageUrl}`);
          continue;
        }

        // Générer un nom de fichier unique selon le type
        const timestamp = Date.now();
        let fileName: string;

        if (imageType === "logo") {
          fileName = `logo_${timestamp}.jpg`;
        } else if (imageType === "cover") {
          fileName = `cover_${timestamp}.jpg`;
        } else {
          fileName = `google_${timestamp}_${i}.jpg`;
        }

        // Traitement de l'image avec Sharp
        const optimizedBuffer = await sharp(buffer)
          .resize(2000, 2000, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 85,
            progressive: true,
          })
          .toBuffer();

        // Construire le chemin relatif pour saveFile
        const subfolder = isGalleryImage ? "gallery" : "";
        const relativePath = [cleanType, cleanSlug, subfolder, fileName]
          .filter(Boolean)
          .join("/");

        // Utiliser saveFile pour envoyer sur local + R2
        const result = await saveFile(optimizedBuffer, relativePath, "image/jpeg");

        console.log(`✅ Image Google uploadée: ${result.url}${result.cloudUrl ? ` (+ R2: ${result.cloudUrl})` : ""}`);

        // Retourner l'URL locale pour la base de données
        uploadedImages.push(result.url);
      } catch (error) {
        console.error(`Erreur traitement image ${imageUrl}:`, error);
        errors.push(
          `Erreur traitement ${imageUrl}: ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`
        );
      }
    }

    return NextResponse.json({
      success: true,
      uploadedImages,
      uploadedCount: uploadedImages.length,
      totalCount: images.length,
      errors,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload des images Google:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
