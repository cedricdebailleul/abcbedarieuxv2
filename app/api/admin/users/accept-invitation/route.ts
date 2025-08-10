import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const acceptInvitationSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  role: z.enum(["user", "admin", "moderator", "dpo", "editor"]),
  password: z.string().min(8),
  name: z.string().min(2),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, role, password, name, firstname, lastname } = acceptInvitationSchema.parse(body);

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

    // Vérifier que l'utilisateur n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Créer le hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Générer un slug unique pour l'utilisateur
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Créer l'utilisateur et son profil en transaction
    const user = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          emailVerified: true, // Email déjà vérifié via l'invitation
          role,
          slug,
          status: "ACTIVE",
        },
      });

      // Créer le compte avec le mot de passe
      await tx.account.create({
        data: {
          userId: newUser.id,
          providerId: "credential",
          accountId: newUser.id,
          password: passwordHash,
        },
      });

      // Créer le profil
      await tx.profile.create({
        data: {
          userId: newUser.id,
          firstname,
          lastname,
        },
      });

      // Marquer le token comme utilisé
      await tx.verification.update({
        where: { id: verification.id },
        data: { used: true },
      });

      // Attribuer un badge de bienvenue
      const welcomeBadge = await tx.badge.findFirst({
        where: { title: "Bienvenue" },
      });

      if (welcomeBadge) {
        await tx.userBadge.create({
          data: {
            userId: newUser.id,
            badgeId: welcomeBadge.id,
            reason: "Inscription réussie",
          },
        });
      }

      return newUser;
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