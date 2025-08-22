import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { NEWSLETTER_DIR } from "@/lib/path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB total
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!["admin", "moderator", "editor"].includes(session.user.role ?? "")) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    if (!files.length)
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    if (files.length > 10)
      return NextResponse.json(
        { error: "Maximum 10 fichiers autorisés" },
        { status: 400 }
      );

    const totalSize = files.reduce((s, f) => s + f.size, 0);
    if (totalSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Taille totale ${(totalSize / 1024 / 1024).toFixed(
            1
          )}MB > 15MB`,
        },
        { status: 400 }
      );
    }

    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé: ${f.type}` },
          { status: 400 }
        );
      }
    }

    if (!existsSync(NEWSLETTER_DIR))
      await mkdir(NEWSLETTER_DIR, { recursive: true });

    const uploadedFiles = [];
    for (const file of files) {
      try {
        const timestamp = Date.now();
        const rand = Math.random().toString(36).slice(2, 10);
        const ext = file.name.split(".").pop() || "dat";
        const safeBase = file.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(0, 100);
        const fileName = `${timestamp}-${rand}-${safeBase}.${ext}`;
        const absPath = path.join(NEWSLETTER_DIR, fileName);

        const buf = Buffer.from(await file.arrayBuffer());
        await writeFile(absPath, buf);

        uploadedFiles.push({
          id: rand,
          name: file.name,
          size: file.size,
          type: file.type,
          url: `/uploads/newsletter/${fileName}`, // exposé via ta route handler
          uploaded: true,
        });
      } catch (err) {
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          error: err instanceof Error ? err.message : "Erreur inconnue",
          uploaded: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${
        uploadedFiles.filter((f) => f.uploaded).length
      } fichier(s) uploadé(s)`,
    });
  } catch (error) {
    console.error("Erreur upload newsletter:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!["admin", "moderator", "editor"].includes(session.user.role ?? "")) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("file");
    if (!fileName)
      return NextResponse.json(
        { error: "Nom de fichier requis" },
        { status: 400 }
      );

    if (
      fileName.includes("..") ||
      fileName.includes("/") ||
      fileName.includes("\\")
    ) {
      return NextResponse.json(
        { error: "Nom de fichier invalide" },
        { status: 400 }
      );
    }

    const filePath = path.join(NEWSLETTER_DIR, fileName);
    if (existsSync(filePath)) {
      await unlink(filePath);
      return NextResponse.json({ success: true, message: "Fichier supprimé" });
    }
    return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
  } catch (error) {
    console.error("Erreur suppression newsletter:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
