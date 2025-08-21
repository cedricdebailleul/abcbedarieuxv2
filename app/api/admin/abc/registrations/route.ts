import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
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

    const registrations = await prisma.abcRegistration.findMany({
      include: {
        processorUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Erreur lors du chargement des inscriptions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
