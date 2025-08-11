import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";

const verifyEmailSchema = z.object({
  code: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Valider les données
    const body = await request.json();
    const { code } = verifyEmailSchema.parse(body);

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email déjà vérifié" },
        { status: 400 }
      );
    }

    // Vérifier le code OTP
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: user.email,
        value: code,
        type: "EMAIL",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 400 }
      );
    }

    // Marquer l'email comme vérifié
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: true,
        status: "ACTIVE",
      },
    });

    // Supprimer le token utilisé
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    // Attribuer le badge "Email vérifié" si il existe
    try {
      const emailVerifiedBadge = await prisma.badge.findFirst({
        where: { title: "Email vérifié" },
      });

      if (emailVerifiedBadge) {
        await prisma.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId: emailVerifiedBadge.id,
            },
          },
          create: {
            userId: user.id,
            badgeId: emailVerifiedBadge.id,
            earnedAt: new Date(),
            reason: "Email vérifié avec succès",
            isVisible: true,
          },
          update: {},
        });
      }
    } catch (badgeError) {
      console.error("Erreur lors de l'attribution du badge:", badgeError);
      // Ne pas faire échouer la vérification si l'attribution du badge échoue
    }

    return NextResponse.json({
      success: true,
      message: "Email vérifié avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Code invalide", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}