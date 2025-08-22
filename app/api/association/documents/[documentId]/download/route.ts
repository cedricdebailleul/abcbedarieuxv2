// app/api/association/documents/[documentId]/download/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import mime from "mime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// racine des uploads: dev => ./uploads ; prod => /app/uploads (via UPLOADS_DIR)
const UPLOADS_ROOT =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
const DOCS_DIR = path.join(UPLOADS_ROOT, "documents");

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication requise" },
        { status: 401 }
      );
    }

    const { documentId } = params;

    const document = await prisma.abcDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        filePath: true, // ex: "/uploads/documents/123_abc_nom.pdf"
        fileName: true, // nom d’origine
        fileSize: true, // taille en octets
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // On récupère le nom de fichier depuis le chemin public stocké en BDD
    const baseName = path.basename(document.filePath || "");
    if (!baseName) {
      return NextResponse.json(
        { error: "Chemin de fichier invalide" },
        { status: 400 }
      );
    }

    // Chemin absolu dans le VOLUME persistant
    const absPath = path.join(DOCS_DIR, baseName);

    // Sécurité: s’assurer qu’on reste bien sous DOCS_DIR
    const resolved = path.resolve(absPath);
    if (!resolved.startsWith(path.resolve(DOCS_DIR))) {
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

    // Lire le fichier
    let file: Buffer;
    try {
      file = await readFile(resolved);
    } catch {
      return NextResponse.json(
        { error: "Fichier non trouvé sur le serveur" },
        { status: 404 }
      );
    }

    // Métadonnées (taille réelle si dispo)
    const st = await stat(resolved).catch(() => null);
    const size = st?.size ?? document.fileSize ?? file.byteLength;

    // Content-Type précis
    const contentType = mime.getType(resolved) || "application/octet-stream";

    // BodyInit valide (Uint8Array)
    const body = new Uint8Array(file);

    const res = new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        // Téléchargement forcé avec un nom sûr
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          document.fileName || baseName
        )}"`,
        // Cache côté client si tu veux (facultatif)
        // "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });

    return res;
  } catch (err) {
    console.error("[download] Erreur:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
