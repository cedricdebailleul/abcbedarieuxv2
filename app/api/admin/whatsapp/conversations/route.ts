import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Récupérer les conversations
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("active");

    const where = {
      ...(search && {
        OR: [
          { phoneNumber: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } }
        ]
      }),
      ...(isActive !== null && { isActive: isActive === "true" })
    };

    const [conversations, total] = await Promise.all([
      prisma.whatsAppConversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              messageType: true,
              isFromBot: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: { lastMessage: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.whatsAppConversation.count({ where })
    ]);

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des conversations:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}