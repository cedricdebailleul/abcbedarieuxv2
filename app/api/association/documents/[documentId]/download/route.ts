import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

// GET /api/association/documents/[documentId]/download - Télécharger un document public
export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Vérifier que l'utilisateur est connecté
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication requise" },
        { status: 401 }
      );
    }

    const { documentId } = await params;

    // Récupérer le document
    const document = await prisma.abcDocument.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: {
          select: {
            name: true,
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

    // Les membres connectés peuvent accéder à tous les documents
    // (pas de restriction d'accès pour les membres de l'association)

    try {
      // Construire le chemin du fichier
      // filePath contient le chemin relatif complet, on extrait juste le nom de fichier
      const fileName = path.basename(document.filePath);
      const uploadsPath = path.join(process.cwd(), "public", "uploads", "documents");
      const fullPath = path.join(uploadsPath, fileName);

      // Lire le fichier
      const fileBuffer = await readFile(fullPath);

      // Préparer la réponse avec le fichier
      const response = new NextResponse(fileBuffer);
      
      // Définir les en-têtes appropriés
      response.headers.set('Content-Type', 'application/octet-stream');
      response.headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(document.fileName)}"`);
      response.headers.set('Content-Length', document.fileSize.toString());

      return response;

    } catch (fileError) {
      console.error("Erreur lors de la lecture du fichier:", fileError);
      return NextResponse.json(
        { error: "Fichier non trouvé sur le serveur" },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error("Erreur lors du téléchargement du document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}