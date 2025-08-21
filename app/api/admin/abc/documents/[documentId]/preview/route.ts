import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// GET /api/admin/abc/documents/[documentId]/preview - Aperçu d'un document
export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (
      !session?.user ||
      !session.user.role ||
      !["admin", "moderator"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer le document
    const document = await prisma.abcDocument.findUnique({
      where: { id: params.documentId },
      include: {
        shares: {
          where: {
            member: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (!["admin", "moderator"].includes(session.user.role)) {
      if (document.shares.length === 0) {
        return NextResponse.json(
          { error: "Vous n'avez pas accès à ce document" },
          { status: 403 }
        );
      }
    }

    // Construire le chemin complet du fichier
    const fullPath = path.join(process.cwd(), "public", document.filePath);

    // Vérifier que le fichier existe
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: "Fichier non trouvé sur le serveur" },
        { status: 404 }
      );
    }

    // Déterminer le type MIME basé sur l'extension
    const ext = path.extname(document.fileName).toLowerCase();
    let mimeType = "application/octet-stream";

    switch (ext) {
      case ".pdf":
        mimeType = "application/pdf";
        break;
      case ".jpg":
      case ".jpeg":
        mimeType = "image/jpeg";
        break;
      case ".png":
        mimeType = "image/png";
        break;
      case ".gif":
        mimeType = "image/gif";
        break;
      case ".txt":
        mimeType = "text/plain";
        break;
      default:
        // Pour les autres types, rediriger vers le téléchargement
        return NextResponse.redirect(
          `/api/admin/abc/documents/${params.documentId}/download`
        );
    }

    // Lire le fichier
    const fileBuffer = await readFile(fullPath);

    // Utiliser une vue ArrayBuffer (Uint8Array) pour assurer un type compatible avec BodyInit
    const uint8Array = new Uint8Array(fileBuffer);

    // Créer la réponse avec le fichier pour affichage inline
    const response = new NextResponse(uint8Array);
    response.headers.set("Content-Type", mimeType);
    response.headers.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(document.fileName)}"`
    );
    response.headers.set("Content-Length", fileBuffer.length.toString());

    // Headers pour permettre l'affichage dans un iframe/nouvel onglet
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");

    return response;
  } catch (error) {
    console.error("Erreur lors de l'aperçu du document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
