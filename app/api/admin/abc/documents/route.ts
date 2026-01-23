import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AbcDocumentType } from "@/lib/generated/prisma";
import path from "node:path";
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import { DOCUMENTS_DIR } from "@/lib/path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
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

const VALID_DOC_TYPES = new Set<AbcDocumentType>([
  "MINUTES",
  "AGENDA",
  "FINANCIAL",
  "LEGAL",
  "COMMUNICATION",
  "OTHER",
]);

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (
      !session?.user ||
      !["admin", "moderator"].includes(safeUserCast(session.user).role ?? "")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const skip = (page - 1) * limit;

    const where: {
      title?: { contains: string; mode: "insensitive" };
      type?: AbcDocumentType;
    } = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (type && VALID_DOC_TYPES.has(type as AbcDocumentType)) {
      where.type = type as AbcDocumentType;
    }

    const [documents, total] = await Promise.all([
      prisma.abcDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          meeting: { select: { id: true, title: true, scheduledAt: true } },
        },
      }),
      prisma.abcDocument.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
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

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (
      !session?.user ||
      !["admin", "moderator"].includes(safeUserCast(session.user).role ?? "")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const type = (formData.get("type") as string) || "";
    const isPublic = formData.get("isPublic") === "true";
    const file = formData.get("file");

    if (!title || !type || !file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Titre, type et fichier sont obligatoires" },
        { status: 400 }
      );
    }

    // 10 MB max
    if (file.size > 10 * 1024 * 1024) {
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

    if (!VALID_DOC_TYPES.has(type as AbcDocumentType)) {
      return NextResponse.json(
        { error: "Type de document invalide" },
        { status: 400 }
      );
    }

    // Assure le répertoire racine des documents dans le VOLUME
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      await fsp.mkdir(DOCUMENTS_DIR, { recursive: true });
    }

    // Nom de fichier sûr et unique
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    const safeName = (file.name || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${rand}_${safeName}`;

    // Chemins: écriture dans le volume, URL publique via /uploads/...
    const filePath = path.join(DOCUMENTS_DIR, fileName);
    const relativeUrl = `/uploads/documents/${fileName}`;

    // Écriture (Buffer -> FS)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fsp.writeFile(filePath, buffer, { flag: "wx" }).catch(async (err) => {
      // Si le fichier existe déjà (rare), remplace le suffixe
      if ((err as NodeJS.ErrnoException).code === "EEXIST") {
        const altName = `${timestamp}_${rand}_${Date.now()}_${safeName}`;
        const altPath = path.join(DOCUMENTS_DIR, altName);
        await fsp.writeFile(altPath, buffer, { flag: "wx" });
        return; // on laisse relativeUrl avec le nom initial seulement si tu mets à jour ici
      }
      throw err;
    });

    // (optionnel) Valider meetingId si tu le passes dans le form plus tard
    const data = {
      title,
      description: description || null,
      type: type as AbcDocumentType,
      fileName: file.name,
      filePath: relativeUrl,
      fileSize: file.size,
      meetingId: null as string | null,
      isPublic,
    };

    const document = await prisma.abcDocument.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        fileName: data.fileName,
        filePath: data.filePath, // <- URL publique /uploads/documents/...
        fileSize: data.fileSize,
        meetingId: data.meetingId,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        meeting: { select: { id: true, title: true, scheduledAt: true } },
        shares: {
          include: {
            member: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    // (optionnel) auto-shares si non public + meetingId
    // ...

    return NextResponse.json({
      document,
      message: "Document créé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la création du document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
