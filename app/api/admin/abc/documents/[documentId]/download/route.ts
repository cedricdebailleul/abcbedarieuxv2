import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// GET /api/admin/abc/documents/[documentId]/download - Télécharger un document
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
      !safeUserCast(session.user).role ||
      !["admin", "moderator"].includes(safeUserCast(session.user).role)
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
    // Les admins/modérateurs peuvent toujours télécharger
    // Pour les autres utilisateurs, vérifier s'ils ont accès au document
    if (!["admin", "moderator"].includes(safeUserCast(session.user).role)) {
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

    // Lire le fichier
    const fileBuffer = await readFile(fullPath);

    // Déterminer le type MIME basé sur l'extension
    const ext = path.extname(document.fileName).toLowerCase();
    let mimeType = "application/octet-stream";

    switch (ext) {
      case ".pdf":
        mimeType = "application/pdf";
        break;
      case ".doc":
        mimeType = "application/msword";
        break;
      case ".docx":
        mimeType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      case ".xls":
        mimeType = "application/vnd.ms-excel";
        break;
      case ".xlsx":
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
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
    }

    // Créer la réponse avec le fichier
    const response = new NextResponse(new Uint8Array(fileBuffer));
    response.headers.set("Content-Type", mimeType);
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(document.fileName)}"`
    );
    response.headers.set("Content-Length", fileBuffer.length.toString());

    return response;
  } catch (error) {
    console.error("Erreur lors du téléchargement du document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
