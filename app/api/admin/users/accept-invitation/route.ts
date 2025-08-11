import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const acceptInvitationSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  role: z.enum(["user", "admin", "moderator", "dpo", "editor"]),
  password: z.string().min(8),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, role, password, firstname, lastname } = acceptInvitationSchema.parse(body);
    
    // Créer un nom d'utilisateur à partir de l'email
    const name = email.split('@')[0];

    // Vérifier le token d'invitation
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: email,
        value: token,
        type: "EMAIL",
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Token d'invitation invalide ou expiré" },
        { status: 400 }
      );
    }

    // Générer un slug unique pour l'utilisateur
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Vérifier si l'utilisateur existe déjà et le supprimer si nécessaire
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Supprimer l'utilisateur existant et ses comptes
      await prisma.$transaction(async (tx) => {
        await tx.account.deleteMany({
          where: { userId: existingUser.id },
        });
        await tx.profile.deleteMany({
          where: { userId: existingUser.id },
        });
        await tx.userBadge.deleteMany({
          where: { userId: existingUser.id },
        });
        await tx.user.delete({
          where: { id: existingUser.id },
        });
      });
    }

    // Utiliser Better Auth pour créer l'utilisateur (le bon format)
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if ("error" in result && result.error) {
      console.error("Erreur Better Auth signUpEmail:", result.error);
      return NextResponse.json(
        { error: "Erreur lors de la création du compte: " + JSON.stringify(result.error) },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur créé
    const createdUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!createdUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé après création" },
        { status: 500 }
      );
    }

    // Mettre à jour l'utilisateur avec les informations supplémentaires
    const user = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'utilisateur avec le rôle, slug et statut
      const updatedUser = await tx.user.update({
        where: { id: createdUser.id },
        data: {
          role,
          slug,
          status: "ACTIVE",
          emailVerified: true, // Important : marquer comme vérifié
        },
      });

      // Marquer le token comme utilisé avant de tout supprimer
      await tx.verification.update({
        where: { id: verification.id },
        data: { used: true },
      });

      // Supprimer tous les autres tokens de vérification pour cet email
      await tx.verification.deleteMany({
        where: {
          identifier: email,
          type: "EMAIL",
          id: { not: verification.id }, // Garder le token utilisé
        },
      });

      // Créer le profil
      await tx.profile.create({
        data: {
          userId: updatedUser.id,
          firstname,
          lastname,
        },
      });

      // Attribuer un badge de bienvenue
      const welcomeBadge = await tx.badge.findFirst({
        where: { title: "Bienvenue" },
      });

      if (welcomeBadge) {
        await tx.userBadge.create({
          data: {
            userId: updatedUser.id,
            badgeId: welcomeBadge.id,
            reason: "Inscription réussie",
          },
        });
      }

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Erreur lors de l'acceptation de l'invitation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}