import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { UPLOADS_ROOT } from "@/lib/path";
import { promises as fs } from "node:fs";

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
      (data.get("subfolder") as string) ||
      (data.get("subFolder") as string) ||
      null;
    const oldImagePath: string = data.get("oldImagePath") as string;
    const imageType: string = (data.get("imageType") as string) || ""; // logo, cover, gallery, etc.
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
    if (oldImagePath?.startsWith("/uploads/")) {
      try {
        const { unlink } = await import("node:fs/promises");
        const oldFullPath = path.join(
          UPLOADS_ROOT,
          oldImagePath.replace(/^\/uploads\//, "")
        );
        if (existsSync(oldFullPath)) {
          await unlink(oldFullPath);
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

    // Ne créer qu'une seule image - pas de versions multiples
    const thumbnailUrl = null;
    const socialUrl = null;

    // Retourner les URLs
    const baseUrl = `/uploads/${type}/${slug || "general"}${
      subfolder ? `/${subfolder}` : ""
    }`;
    const fileUrl = `${baseUrl}/${fileName}`;

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

// Règle d’auto-service : user peut supprimer seulement ses fichiers temporaires
type SessionLike = { user?: { role?: string | null } | null };

/**
 * Check whether the current session is allowed to delete the given relative path.
 * Using a narrow SessionLike type instead of `any`.
 */
function canDelete(session: SessionLike | null | undefined, relPath: string) {
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
    const clientPath = searchParams.get("path"); // ex: /uploads/places/temp-.../gallery/x.jpg
    if (!clientPath || !clientPath.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

    // On transforme l’URL publique -> chemin réel sous UPLOADS_ROOT
    const rel = clientPath.replace(/^\/uploads\//, ""); // places/…
    const abs = path.resolve(UPLOADS_ROOT, rel); // /app/uploads/places/…
    if (!isUnderUploads(abs)) {
      return NextResponse.json({ error: "Chemin interdit" }, { status: 403 });
    }

    if (!canDelete(session, rel)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const st = await fs.stat(abs).catch(() => null);
    if (!st) {
      return NextResponse.json(
        { error: "Fichier introuvable" },
        { status: 404 }
      );
    }

    if (st.isDirectory()) {
      await fs.rm(abs, { recursive: true, force: true });
    } else {
      await fs.unlink(abs);
    }

    // Nettoyage doux des dossiers vides (jusqu’à /app/uploads)
    try {
      let dir = path.dirname(abs);
      const stop = path.resolve(UPLOADS_ROOT);
      for (let i = 0; i < 4 && dir !== stop && isUnderUploads(dir); i++) {
        const entries = await fs.readdir(dir).catch(() => []);
        if (entries.length) break;
        await fs.rmdir(dir).catch(() => {});
        dir = path.dirname(dir);
      }
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/upload error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
