import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateDocumentSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire"),
  description: z.string().nullable().optional(),
  type: z.enum(['MINUTES', 'AGENDA', 'FINANCIAL', 'LEGAL', 'COMMUNICATION', 'OTHER']),
  meetingId: z.string().nullable().optional(),
});

// GET /api/admin/abc/documents/[documentId] - Récupérer un document
export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const document = await prisma.abcDocument.findUnique({
      where: { id: params.documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        meeting: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
          },
        },
        shares: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
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

    return NextResponse.json({ document });

  } catch (error) {
    console.error("Erreur lors de la récupération du document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/abc/documents/[documentId] - Modifier un document
export async function PUT(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateDocumentSchema.parse(body);

    // Vérifier que le document existe
    const existingDocument = await prisma.abcDocument.findUnique({
      where: { id: params.documentId },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que la réunion existe si fournie
    if (data.meetingId) {
      const meeting = await prisma.abcMeeting.findUnique({
        where: { id: data.meetingId },
      });
      if (!meeting) {
        return NextResponse.json(
          { error: "Réunion non trouvée" },
          { status: 404 }
        );
      }
    }

    const document = await prisma.abcDocument.update({
      where: { id: params.documentId },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        meetingId: data.meetingId,
        updatedAt: new Date(),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        meeting: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
          },
        },
        shares: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      document,
      message: "Document modifié avec succès",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la modification du document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/abc/documents/[documentId] - Supprimer un document
export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que le document existe
    const document = await prisma.abcDocument.findUnique({
      where: { id: params.documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le fichier physique si nécessaire
    // TODO: Implémenter la suppression du fichier du système de fichiers
    // const fs = require('fs');
    // const path = require('path');
    // const fullPath = path.join(process.cwd(), 'public', document.filePath);
    // if (fs.existsSync(fullPath)) {
    //   fs.unlinkSync(fullPath);
    // }

    await prisma.abcDocument.delete({
      where: { id: params.documentId },
    });

    return NextResponse.json({
      message: "Document supprimé avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la suppression du document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}