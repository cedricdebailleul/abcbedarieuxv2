// app/api/admin/abc/documents/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { DOCUMENTS_DIR } from "@/lib/path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Types autorisés
const ALLOWED_TYPES = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
]);

export async function POST(request: Request) {
  try {
    // Auth
    const session = await auth.api.getSession({ headers: request.headers });
    if (
      !session?.user ||
      !["admin", "moderator"].includes(session.user.role ?? "")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // FormData + fichier
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier valide fourni" },
        { status: 400 }
      );
    }

    // Tailles & types
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 10MB)" },
        { status: 400 }
      );
    }
    if (!file.type || !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé: ${file.type || "unknown"}` },
        { status: 400 }
      );
    }

    // Nom de fichier sûr et unique
    const safeBase = (file.name || "document")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 180); // évite les noms trop longs
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}_${safeBase}`;

    // Répertoire cible (dans le VOLUME)
    if (!existsSync(DOCUMENTS_DIR)) {
      await mkdir(DOCUMENTS_DIR, { recursive: true });
    }

    // Écriture
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const absPath = path.join(DOCUMENTS_DIR, fileName);
    await writeFile(absPath, buffer);

    // URL publique servie par ta route /uploads/[...path]
    const publicUrl = `/uploads/documents/${fileName}`;

    return NextResponse.json({
      fileName: file.name,
      uploadedFileName: fileName,
      filePath: publicUrl,
      fileSize: file.size,
      fileType: file.type,
      message: "Fichier uploadé avec succès",
    });
  } catch (error) {
    console.error("[documents/upload] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
