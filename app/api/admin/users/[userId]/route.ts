import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["user", "admin", "moderator", "dpo", "editor"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED", "PENDING_VERIFICATION"]).optional(),
  banned: z.boolean().optional(),
  banReason: z.string().optional(),
  banExpires: z.string().datetime().optional(),
  profile: z.object({
    firstname: z.string().optional(),
    lastname: z.string().optional(),
    bio: z.string().optional(),
    phone: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    isPublic: z.boolean().optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Vérifier l'authentification et les permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin ou consulte son propre profil
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = currentUser?.role === "admin";
    const resolvedParams = await params;
    const isOwnProfile = session.user.id === resolvedParams.userId;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Récupérer l'utilisateur avec toutes ses relations
    const user = await prisma.user.findUnique({
      where: { 
        id: resolvedParams.userId,
        deletedAt: null, // Exclure les utilisateurs supprimés
      },
      include: {
        profile: true,
        badges: {
          include: {
            badge: true,
          },
          orderBy: {
            earnedAt: "desc",
          },
        },
        sessions: {
          where: {
            isActive: true,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        _count: {
          select: {
            sessions: true,
            posts: true,
            gdprRequests: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Masquer certaines informations sensibles si ce n'est pas l'admin
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      status: user.status,
      slug: user.slug,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      ...(isAdmin && {
        lastLoginIp: user.lastLoginIp,
        failedLogins: user.failedLogins,
        lockedUntil: user.lockedUntil,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        bannedBy: user.bannedBy,
      }),
      profile: user.profile,
      badges: user.badges.map(userBadge => ({
        id: userBadge.id,
        earnedAt: userBadge.earnedAt,
        reason: userBadge.reason,
        isVisible: userBadge.isVisible,
        badge: {
          id: userBadge.badge.id,
          title: userBadge.badge.title,
          description: userBadge.badge.description,
          iconUrl: userBadge.badge.iconUrl,
          color: userBadge.badge.color,
          category: userBadge.badge.category,
          rarity: userBadge.badge.rarity,
        },
      })),
      ...(isAdmin && {
        sessions: user.sessions.map(session => ({
          id: session.id,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          isActive: session.isActive,
        })),
      }),
      counts: user._count,
    };

    return NextResponse.json(userData);

  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Vérifier l'authentification et les permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin ou modifie son propre profil
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = currentUser?.role === "admin";
    const resolvedParams = await params;
    const isOwnProfile = session.user.id === resolvedParams.userId;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Parser les données
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    // Restrictions pour les non-admins
    if (!isAdmin) {
      // Les utilisateurs normaux ne peuvent pas modifier leur rôle, statut, etc.
      const restrictedFields = ["role", "status", "banned", "banReason", "banExpires"];
      for (const field of restrictedFields) {
        if (field in data) {
          delete data[field as keyof typeof data];
        }
      }
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { 
        id: resolvedParams.userId,
        deletedAt: null,
      },
      include: {
        profile: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier l'unicité de l'email si modifié
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: resolvedParams.userId },
          deletedAt: null,
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const { profile: profileData, ...userData } = data;

    // Si l'email est modifié, marquer comme non vérifié
    if (userData.email && userData.email !== existingUser.email) {
      (userData as any).emailVerified = false;
    }

    // Mettre à jour l'utilisateur et son profil
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'utilisateur
      const user = await tx.user.update({
        where: { id: resolvedParams.userId },
        data: userData,
        include: {
          profile: true,
        },
      });

      // Mettre à jour ou créer le profil si des données sont fournies
      if (profileData) {
        if (existingUser.profile) {
          await tx.profile.update({
            where: { userId: resolvedParams.userId },
            data: profileData,
          });
        } else {
          await tx.profile.create({
            data: {
              userId: resolvedParams.userId,
              ...profileData,
            },
          });
        }
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        profile: updatedUser.profile,
      },
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Vérifier l'authentification et les permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les admins peuvent supprimer des utilisateurs
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Empêcher l'auto-suppression
    const resolvedParams = await params;
    if (session.user.id === resolvedParams.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { 
        id: resolvedParams.userId,
        deletedAt: null,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Parser les paramètres de requête pour déterminer le type de suppression
    const url = new URL(request.url);
    const hardDelete = url.searchParams.get("hard") === "true";

    if (hardDelete) {
      // Suppression complète (pour le RGPD)
      await prisma.user.delete({
        where: { id: resolvedParams.userId },
      });
    } else {
      // Suppression logique
      await prisma.user.update({
        where: { id: resolvedParams.userId },
        data: {
          deletedAt: new Date(),
          status: "DELETED",
          // Optionnel : anonymiser certaines données
          email: `deleted-user-${resolvedParams.userId}@deleted.local`,
          name: `Utilisateur supprimé`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: hardDelete 
        ? "Utilisateur supprimé définitivement"
        : "Utilisateur supprimé",
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}