import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB total
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
];

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
    if (!session.user.role || !["admin", "moderator", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier le nombre total de fichiers
    if (files.length > 10) {
      return NextResponse.json({ error: "Maximum 10 fichiers autorisés" }, { status: 400 });
    }

    // Vérifier la taille totale
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Taille totale (${(totalSize / 1024 / 1024).toFixed(1)}MB) dépasse la limite de 15MB` 
      }, { status: 400 });
    }

    // Vérifier les types de fichiers
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ 
          error: `Type de fichier non autorisé: ${file.type}` 
        }, { status: 400 });
      }
    }

    const uploadedFiles = [];
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'newsletter');

    // Créer le dossier s'il n'existe pas
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      try {
        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split('.').pop();
        const fileName = `${timestamp}-${randomString}.${extension}`;
        const filePath = join(uploadDir, fileName);

        // Convertir le fichier en buffer et l'écrire
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/newsletter/${fileName}`;

        uploadedFiles.push({
          id: randomString,
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
          uploaded: true
        });

      } catch (error) {
        console.error(`Erreur lors de l'upload de ${file.name}:`, error);
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          error: `Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          uploaded: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.filter(f => f.uploaded).length} fichier(s) uploadé(s) avec succès`
    });

  } catch (error) {
    console.error("Erreur lors de l'upload des pièces jointes:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    if (!session.user.role || !["admin", "moderator", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json({ error: "Nom de fichier requis" }, { status: 400 });
    }

    // Sécurité: vérifier que le fichier est dans le bon dossier
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json({ error: "Nom de fichier invalide" }, { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'uploads', 'newsletter', fileName);

    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      return NextResponse.json({ success: true, message: "Fichier supprimé" });
    } else {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}