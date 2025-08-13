import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const claimRequestSchema = z.object({
  // Informations personnelles
  firstName: z.string().min(2, "Le prénom doit faire au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Le téléphone doit faire au moins 10 caractères"),

  // Revendication
  message: z.string().min(20, "Le message doit faire au moins 20 caractères"),
  proof: z.string().url().optional(), // URL vers une preuve (document, photo, etc.)
  relationship: z.enum(["owner", "manager", "employee", "family", "other"]).default("owner"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que la place existe et peut être revendiquée
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true,
      },
    });

    if (!place) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
    }

    // Vérifier que la place n'a pas déjà un propriétaire
    if (place.ownerId) {
      return NextResponse.json({ error: "Cette place a déjà un propriétaire" }, { status: 400 });
    }

    // Vérifier qu'il n'y a pas déjà une demande en cours de cet utilisateur
    const existingRequest = await prisma.placeClaim.findFirst({
      where: {
        placeId,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Vous avez déjà une demande en cours pour cette place" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = claimRequestSchema.parse(body);

    // Créer un message enrichi avec les informations personnelles
    const enrichedMessage = `
DEMANDE DE REVENDICATION

👤 INFORMATIONS PERSONNELLES:
Prénom: ${validatedData.firstName}
Nom: ${validatedData.lastName}
Email: ${validatedData.email}
Téléphone: ${validatedData.phone}
Relation: ${
      validatedData.relationship === "owner"
        ? "Propriétaire"
        : validatedData.relationship === "manager"
          ? "Gérant"
          : validatedData.relationship === "employee"
            ? "Employé"
            : validatedData.relationship === "family"
              ? "Famille"
              : "Autre"
    }

📝 JUSTIFICATION:
${validatedData.message}

${validatedData.proof ? `🔗 PREUVE: ${validatedData.proof}` : ""}
    `.trim();

    // Créer la demande de revendication
    const claimRequest = await prisma.placeClaim.create({
      data: {
        placeId,
        userId: session.user.id,
        message: enrichedMessage,
        proof: validatedData.proof,
        status: "PENDING",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        place: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // TODO: Envoyer notification aux admins
    // notifyAdminsClaimRequest(claimRequest).catch(console.error);

    return NextResponse.json({
      success: true,
      message:
        "Votre demande de revendication a été soumise. Un administrateur l'examinera sous peu.",
      requestId: claimRequest.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de la demande:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
