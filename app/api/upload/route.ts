import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { UPLOADS_ROOT } from "@/lib/path";
import { saveFile, deleteFile, getFileUrl, getStorageInfo } from "@/lib/storage";
import { promises as fs } from "node:fs";

// Schéma de validation stricte pour les uploads
const uploadSchema = z.object({
  type: z.enum(['posts', 'places', 'events', 'profiles', 'newsletter', 'partners']),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/i),
  imageType: z.enum(['logo', 'cover', 'gallery', '']).optional().default(''),
  subfolder: z.string().max(50).regex(/^[a-z0-9-_]*$/i).optional(),
});

function isUnderUploads(abs: string) {
  const root = path.resolve(UPLOADS_ROOT);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  return abs.startsWith(rootWithSep);
}

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

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    // Validation stricte avec Zod
    const validationResult = uploadSchema.safeParse({
      type: data.get("type") as string,
      slug: data.get("slug") as string,
      imageType: (data.get("imageType") as string) || "",
      subfolder: (data.get("subfolder") as string) || (data.get("subFolder") as string) || "",
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Paramètres invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { type, slug, imageType, subfolder } = validationResult.data;
    const cropData = data.get("cropData") as string;
    const oldImagePath: string = data.get("oldImagePath") as string;

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
      UPLOADS_ROOT,
      type,
      slug || "general",
      subfolder || ""
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

    // Optimiser l'image avec des tailles différentes selon le type
    let maxWidth = 2000;
    let maxHeight = 2000;
    let quality = 85;
    
    // Paramètres spécifiques selon le type d'image
    switch (imageType) {
      case "cover":
        maxWidth = 2400; // Plus large pour la cover
        maxHeight = 1600; // Plus haut pour une meilleure résolution
        quality = 90; // Qualité supérieure pour la cover
        break;
      case "logo":
        maxWidth = 800;
        maxHeight = 800;
        quality = 95; // Haute qualité pour le logo
        break;
      case "gallery":
        maxWidth = 1800;
        maxHeight = 1800;
        quality = 85;
        break;
      default:
        // Garder les valeurs par défaut
        break;
    }
    
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: quality,
        progressive: true,
      })
      .toBuffer();

    // Supprimer l'ancienne image si fournie
    if (oldImagePath?.startsWith("/uploads/")) {
      try {
        const relativePath = oldImagePath.replace(/^\/uploads\//, "");
        await deleteFile(relativePath);
      } catch (error) {
        console.error(
          "Erreur lors de la suppression de l'ancienne image:",
          error
        );
        // Continuer même si la suppression échoue
      }
    }

    // Construire le chemin relatif pour le stockage
    const relativePath = path.join(
      type,
      slug || "general",
      subfolder || "",
      fileName
    );

    // Sauvegarder le fichier via le module storage
    const uploadResult = await saveFile(
      optimizedBuffer,
      relativePath,
      "image/jpeg"
    );

    console.log(`✅ Fichier uploadé: ${uploadResult.url}${uploadResult.cloudUrl ? ` (+ R2: ${uploadResult.cloudUrl})` : ""}`);

    // Obtenir les métadonnées de l'image
    const metadata = await sharp(optimizedBuffer).metadata();

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      cloudUrl: uploadResult.cloudUrl,
      thumbnail: null,
      social: null,
      filename: uploadResult.filename,
      size: uploadResult.size,
      dimensions: {
        width: metadata.width,
        height: metadata.height,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier" },
      { status: 500 }
    );
  }
}

/**
 * Check whether the current session is allowed to delete the given relative path.
 * Using a narrow SessionLike type instead of `any`.
 */
function canDelete(session: { user?: { role?: string | null } | null }, relPath: string) {
  const role = session?.user?.role;
  if (role === "admin" || role === "editor") return true;
  const norm = relPath.replace(/\\/g, "/");
  return /^places\/temp-[^/]+\//i.test(norm); // ex: places/temp-.../gallery/xxx.jpg
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientPath = searchParams.get("path"); // URL or path
    
    if (!clientPath) {
      return NextResponse.json({ error: "Chemin manquant" }, { status: 400 });
    }

    // Récupérer config pour vérifier si c'est une URL R2 valide
    const { r2PublicUrl } = getStorageInfo();
    let relativePath: string | null = null;

    // Déterminer le chemin relatif selon le type d'input
    if (clientPath.startsWith("/uploads/")) {
      relativePath = clientPath.replace(/^\/uploads\//, "").replace(/\\/g, "/");
    } else if (r2PublicUrl && clientPath.startsWith(r2PublicUrl)) {
      relativePath = clientPath.slice(r2PublicUrl.length);
      if (relativePath.startsWith("/")) relativePath = relativePath.slice(1);
    } else {
      // Peut-être déjà un chemin relatif ?
      // On accepte temporairement tout pour essayer de delete via le storage provider
      // Mais on bloque les tentatives de remonter dans l'arborescence (path traversal)
      if (clientPath.includes("..")) {
         return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
      }
      relativePath = clientPath;
    }

    if (!relativePath) {
      return NextResponse.json({ error: "Chemin non reconnu" }, { status: 400 });
    }

    // Vérification permissions (basique)
    if (!canDelete(session, relativePath)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes (seuls admin/editor ou fichiers temporaires)" },
        { status: 403 }
      );
    }

    // Tenter la suppression via le storage abstraction
    // Note: deleteFile throw une erreur si ça échoue totalement
    try {
      await deleteFile(relativePath);
    } catch (error) {
       console.error("Erreur deleteFile:", error);
       // On continue, c'est peut-être déjà supprimé ou introuvable
    }
    
    // Nettoyage dossiers vides (si local)
    // On garde cette logique uniquement si c'était un fichier local
    if (clientPath.startsWith("/uploads/")) {
      try {
        const abs = path.resolve(UPLOADS_ROOT, relativePath);
        if (isUnderUploads(abs)) {
           let dir = path.dirname(abs);
           const stop = path.resolve(UPLOADS_ROOT);
           for (let i = 0; i < 4 && dir !== stop && isUnderUploads(dir); i++) {
             const entries = await fs.readdir(dir).catch(() => []);
             if (entries.length) break;
             await fs.rmdir(dir).catch(() => {});
             dir = path.dirname(dir);
           }
        }
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/upload error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
