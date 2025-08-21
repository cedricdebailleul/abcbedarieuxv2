import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AbcDocumentType, Prisma } from "@/lib/generated/prisma";
import path from "path";
import fs from "fs";

// GET /api/admin/abc/documents - Liste des documents
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const meetingId = searchParams.get("meetingId");

    const skip = (page - 1) * limit;

    // >>>>>>>>>>>>>>>>>>
    // Le where au bon type Prisma
    // >>>>>>>>>>>>>>>>>>
    const where: Prisma.AbcDocumentWhereInput = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { fileName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(type ? { type: type as AbcDocumentType } : {}),
      ...(meetingId ? { meetingId } : {}),
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { fileName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type ? (type as AbcDocumentType) : undefined;
    }

    if (meetingId) {
      where.meetingId = meetingId;
    }

    const [documents, total] = await Promise.all([
      prisma.abcDocument.findMany({
        where: where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
      }),
      prisma.abcDocument.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/admin/abc/documents - Créer un document avec upload
export async function POST(request: Request) {
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

    // Gérer le FormData pour l'upload de fichier
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const isPublic = formData.get("isPublic") === "true";
    const file = formData.get("file") as File;

    console.log("FormData received:", {
      title,
      description,
      type,
      isPublic,
      file: file ? { name: file.name, size: file.size, type: file.type } : null,
    });

    if (!title || !type || !file) {
      return NextResponse.json(
        { error: "Titre, type et fichier sont obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien un fichier
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Le fichier fourni n'est pas valide" },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 10MB)" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
    ];

    if (!file.type || !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé: ${file.type || "unknown"}` },
        { status: 400 }
      );
    }

    // Valider le type de document
    const validDocumentTypes = [
      "MINUTES",
      "AGENDA",
      "FINANCIAL",
      "LEGAL",
      "COMMUNICATION",
      "OTHER",
    ];
    if (!validDocumentTypes.includes(type)) {
      return NextResponse.json(
        { error: "Type de document invalide" },
        { status: 400 }
      );
    }

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const safeName = (file.name || "unknown").replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${randomSuffix}_${safeName}`;

    // Créer le répertoire de destination
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "documents"
    );
    if (!fs.existsSync(uploadDir)) {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    }

    // Chemin complet du fichier
    const filePath = path.join(uploadDir, fileName);
    const relativeFilePath = `/uploads/documents/${fileName}`;

    // Écrire le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.promises.writeFile(filePath, buffer);

    // Valider les données
    const data = {
      title,
      description: description || null,
      type,
      fileName: file.name,
      filePath: relativeFilePath,
      fileSize: file.size,
      meetingId: null, // Peut être ajouté plus tard
      isPublic,
    };

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

    const document = await prisma.abcDocument.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type as AbcDocumentType,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        meetingId: data.meetingId,
        uploadedById: session.user.id,
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

    // Si le document n'est pas public, créer des partages par défaut (optionnel)
    if (!data.isPublic && data.meetingId) {
      // Partager automatiquement avec tous les participants de la réunion
      const attendees = await prisma.abcMeetingAttendee.findMany({
        where: { meetingId: data.meetingId },
        include: { member: true },
      });

      if (attendees.length > 0) {
        await prisma.abcDocumentShare.createMany({
          data: attendees.map((attendee) => ({
            documentId: document.id,
            memberId: attendee.memberId,
            accessLevel: "READ",
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      document,
      message: "Document créé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création du document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
