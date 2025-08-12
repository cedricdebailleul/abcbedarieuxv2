import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions
    const userRole = session.user.role;
    if (!userRole || !["admin", "editor", "user"].includes(userRole)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const sanitize = (s: string) =>
      s.replace(/[^a-z0-9-_]/gi, "").toLowerCase();
    const type = sanitize((data.get("type") as string) || "posts");
    const slug = sanitize(data.get("slug") as string);
    const cropData = data.get("cropData") as string;
    const subfolderRaw: string | null =
      (data.get("subfolder") as string) || (data.get("subFolder") as string) || null;
    const oldImagePath: string = data.get("oldImagePath") as string;
    const imageType: string = data.get("imageType") as string || ""; // logo, cover, gallery, etc.
    const subfolder = subfolderRaw ? sanitize(subfolderRaw) : "";

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Valider le type de fichier
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Valider la taille du fichier (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux. Taille maximale: 10MB." },
        { status: 400 }
      );
    }

    const bytes: ArrayBuffer = await file.arrayBuffer();
    const buffer: Buffer = Buffer.from(bytes);
    const bytesLike: ArrayBuffer = await file.arrayBuffer();
    const bufferSafe: Buffer = Buffer.from(new Uint8Array(bytesLike));

    // Créer le nom de fichier unique (toujours en .jpg car converti)
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileExtension = path.extname(originalName);
    const baseName = path.basename(originalName, fileExtension);
    
    // Nom spécifique selon le type d'image
    let fileName: string;
    if (imageType === "logo") {
      fileName = `logo_${timestamp}.jpg`;
    } else if (imageType === "cover") {
      fileName = `cover_${timestamp}.jpg`;
    } else if (subfolder === "gallery") {
      fileName = `gallery_${timestamp}_${baseName}.jpg`;
    } else {
      fileName = `${timestamp}_${baseName}.jpg`;
    }

    // Déterminer le chemin de destination
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      type,
      slug || "general",
      subfolder
    );

    // Créer les dossiers s'ils n'existent pas
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    // Traitement de l'image avec Sharp
    let imageBuffer: Buffer = bufferSafe;

    // Appliquer le crop si fourni
    if (cropData) {
      try {
        const crop = JSON.parse(cropData);
        const { x, y, width, height } = crop;

        // Obtenir les dimensions de l'image originale
        const metadata = await sharp(imageBuffer).metadata();
        const originalWidth = metadata.width || 0;
        const originalHeight = metadata.height || 0;

        // Les coordonnées du crop sont basées sur l'image affichée dans le navigateur
        // Il faut les recalculer pour l'image originale
        // Note: les coordonnées du crop sont déjà en pixels réels de l'image naturelle
        // car calculées avec les facteurs d'échelle dans le cropper

        imageBuffer = await sharp(imageBuffer)
          .extract({
            left: Math.max(0, Math.round(x)),
            top: Math.max(0, Math.round(y)),
            width: Math.min(originalWidth - Math.round(x), Math.round(width)),
            height: Math.min(
              originalHeight - Math.round(y),
              Math.round(height)
            ),
          })
          .toBuffer();
      } catch (error) {
        console.error("Erreur lors du crop:", error);
        // Continuer sans crop en cas d'erreur
      }
    }

    // Optimiser l'image
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(2000, 2000, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    // Supprimer l'ancienne image si fournie
    if (oldImagePath && oldImagePath.startsWith("/uploads/")) {
      try {
        const { unlink } = await import("fs/promises");
        const oldFullPath = path.join(process.cwd(), "public", oldImagePath);
        const oldThumbnailPath = path.join(
          path.dirname(oldFullPath),
          `thumb_${path.basename(oldFullPath)}`
        );
        const oldSocialPath = path.join(
          path.dirname(oldFullPath),
          `social_${path.basename(oldFullPath)}`
        );

        if (existsSync(oldFullPath)) {
          await unlink(oldFullPath);
        }
        if (existsSync(oldThumbnailPath)) {
          await unlink(oldThumbnailPath);
        }
        if (existsSync(oldSocialPath)) {
          await unlink(oldSocialPath);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la suppression de l'ancienne image:",
          error
        );
        // Continuer même si la suppression échoue
      }
    }

    // Sauvegarder le fichier
    await writeFile(filePath, optimizedBuffer);

    // Créer également une version thumbnail
    const thumbnailName = `thumb_${fileName.replace(fileExtension, ".jpg")}`;
    const thumbnailPath = path.join(uploadDir, thumbnailName);

    // presets selon le type d'image
    const isGallery = subfolder === "gallery";
    const isLogo = imageType === "logo";
    const isCover = imageType === "cover";
    
    const thumbW = isLogo ? 400 : isCover ? 1200 : isGallery ? 600 : 1080;
    const thumbH = isLogo ? 400 : isCover ? 630 : isGallery ? 600 : 600;

    const thumbnailBuffer = await sharp(optimizedBuffer)
      .resize(thumbW, thumbH, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    await writeFile(thumbnailPath, thumbnailBuffer);

    // Créer une version optimisée pour les réseaux sociaux (1200x630 - ratio 1.91:1)
    const socialName = `social_${fileName.replace(fileExtension, ".jpg")}`;
    const socialPath = path.join(uploadDir, socialName);

    const socialBuffer = await sharp(optimizedBuffer)
      .resize(1200, 630, {
        fit: "cover",
        position: "center",
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    await writeFile(socialPath, socialBuffer);

    // Retourner les URLs
    const baseUrl = `/uploads/${type}/${slug || "general"}${
      subfolder ? `/${subfolder}` : ""
    }`;
    const fileUrl = `${baseUrl}/${fileName}`;
    const thumbnailUrl = `${baseUrl}/${thumbnailName}`;
    const socialUrl = `${baseUrl}/${socialName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      thumbnail: thumbnailUrl,
      social: socialUrl,
      filename: fileName,
      size: optimizedBuffer.length,
      dimensions: await sharp(optimizedBuffer)
        .metadata()
        .then((meta) => ({
          width: meta.width,
          height: meta.height,
        })),
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier" },
      { status: 500 }
    );
  }
}

// Route pour supprimer un fichier
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions
    const userRole = session.user.role;
    if (!userRole || !["admin", "editor"].includes(userRole)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "Chemin du fichier requis" },
        { status: 400 }
      );
    }

    // Sécurité: vérifier que le chemin est dans public/uploads/
    if (!filePath.startsWith("/uploads/")) {
      return NextResponse.json(
        { error: "Chemin non autorisé" },
        { status: 403 }
      );
    }

    const fullPath = path.join(process.cwd(), "public", filePath);
    const thumbnailPath = path.join(
      path.dirname(fullPath),
      `thumb_${path.basename(fullPath)}`
    );
    const socialPath = path.join(
      path.dirname(fullPath),
      `social_${path.basename(fullPath)}`
    );

    // Supprimer les fichiers s'ils existent
    try {
      const { unlink } = await import("fs/promises");
      let deletedCount = 0;
      
      if (existsSync(fullPath)) {
        await unlink(fullPath);
        deletedCount++;
        console.log(`Fichier supprimé: ${fullPath}`);
      }
      if (existsSync(thumbnailPath)) {
        await unlink(thumbnailPath);
        deletedCount++;
        console.log(`Thumbnail supprimé: ${thumbnailPath}`);
      }
      if (existsSync(socialPath)) {
        await unlink(socialPath);
        deletedCount++;
        console.log(`Social supprimé: ${socialPath}`);
      }
      
      console.log(`Total fichiers supprimés: ${deletedCount}`);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      throw error; // Re-lancer l'erreur pour que le client sache qu'il y a eu un problème
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fichier" },
      { status: 500 }
    );
  }
}
