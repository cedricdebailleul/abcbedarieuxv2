"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma";
import { headers } from "next/headers";
import { ActionResult } from "@/lib/types";

export async function getUserPlacesAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      slug: string;
      type: string;
    }>
  >
> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    // Récupérer les lieux où l'utilisateur est propriétaire
    const places = await prisma.place.findMany({
      where: {
        ownerId: session.user.id,
        status: { in: [PlaceStatus.ACTIVE, PlaceStatus.DRAFT] },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: places,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des lieux utilisateur:",
      error
    );
    return {
      success: false,
      error: "Erreur lors de la récupération de vos lieux",
    };
  }
}

// Action pour récupérer tous les lieux (pour les admins)
export async function getAllPlacesAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      slug: string;
      type: string;
      city?: string;
    }>
  >
> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== "admin") {
      return {
        success: false,
        error: "Accès non autorisé",
      };
    }

    // Récupérer tous les lieux publiés
    const places = await prisma.place.findMany({
      where: {
        status: { in: [PlaceStatus.ACTIVE, PlaceStatus.DRAFT] },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        city: true,
      },
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });

    return {
      success: true,
      data: places,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les lieux:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des lieux",
    };
  }
}
