import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isVerified: true,
        subscribedAt: true,
        preferences: {
          select: {
            events: true,
            places: true,
            offers: true,
            news: true,
            frequency: true,
          },
        },
      },
    });

    if (!subscriber || !subscriber.isActive) {
      return NextResponse.json(
        { error: "Abonnement non trouvé ou inactif" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriber: {
        ...subscriber,
        preferences: subscriber.preferences || {
          events: true,
          places: true,
          offers: false,
          news: true,
          frequency: "WEEKLY",
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'abonné:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}