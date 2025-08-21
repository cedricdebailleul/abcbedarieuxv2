import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user?.role || !["admin", "moderator", "editor"].includes(user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    try {
      // Récupérer tous les abonnés avec leurs préférences
      const subscribers = await prisma.newsletterSubscriber.findMany({
        include: {
          preferences: true,
        },
        orderBy: { subscribedAt: "desc" },
      });

      // Créer le contenu CSV
      const csvHeaders = [
        "Email",
        "Prénom",
        "Nom",
        "Statut",
        "Vérifié",
        "Date d'inscription",
        "Dernier email",
        "Événements",
        "Commerces",
        "Offres",
        "Actualités",
        "Fréquence",
      ];

      const csvRows = subscribers.map((subscriber) => [
        subscriber.email,
        subscriber.firstName || "",
        subscriber.lastName || "",
        subscriber.isActive ? "Actif" : "Inactif",
        subscriber.isVerified ? "Vérifié" : "Non vérifié",
        subscriber.subscribedAt.toLocaleDateString("fr-FR"),
        subscriber.lastEmailSent
          ? subscriber.lastEmailSent.toLocaleDateString("fr-FR")
          : "",
        subscriber.preferences?.events ? "Oui" : "Non",
        subscriber.preferences?.places ? "Oui" : "Non",
        subscriber.preferences?.offers ? "Oui" : "Non",
        subscriber.preferences?.news ? "Oui" : "Non",
        subscriber.preferences?.frequency || "WEEKLY",
      ]);

      // Construire le CSV
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
      ].join("\n");

      // Retourner le fichier CSV
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="newsletter-subscribers-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    } catch (prismaError) {
      if (
        prismaError instanceof Error &&
        prismaError.message.includes("newsletterSubscriber")
      ) {
        return NextResponse.json(
          {
            error: "Les tables de newsletter ne sont pas encore créées.",
            migrationRequired: true,
          },
          { status: 500 }
        );
      }
      throw prismaError;
    }
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
