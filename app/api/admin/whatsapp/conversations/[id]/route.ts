import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Récupérer les messages d'une conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const limit = parseInt(searchParams.get("limit") || "50");

    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    return NextResponse.json({
      conversation,
      messages: conversation.messages.reverse(), // Ordre chronologique
      pagination: {
        page,
        limit,
        total: conversation._count.messages,
        pages: Math.ceil(conversation._count.messages / limit)
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération de la conversation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}