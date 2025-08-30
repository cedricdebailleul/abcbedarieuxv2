import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user || !safeUserCast(session.user).role || !["admin", "moderator"].includes(safeUserCast(session.user).role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer l'inscription
    const registration = await prisma.abcRegistration.findUnique({
      where: { id: params.id },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Inscription non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si un utilisateur existe avec cet email
    const user = await prisma.user.findUnique({
      where: { email: registration.email },
    });

    if (!user) {
      return NextResponse.json({
        hasMember: false,
        user: null,
        member: null,
      });
    }

    // Vérifier si un membre ABC existe pour cet utilisateur
    const member = await prisma.abcMember.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      hasMember: !!member,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      member: member ? {
        id: member.id,
        memberNumber: member.memberNumber,
        type: member.type,
        status: member.status,
        membershipDate: member.membershipDate,
        joinedAt: member.joinedAt,
      } : null,
    });

  } catch (error) {
    console.error("Erreur lors de la vérification du statut membre:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}