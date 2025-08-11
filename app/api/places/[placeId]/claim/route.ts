import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyAdminsPlaceClaimed } from "@/lib/place-notifications";

const claimSchema = z.object({
  message: z.string().min(10, "Le message doit faire au moins 10 caractères"),
  proof: z.string().optional(), // URL vers une preuve (document, photo, etc.)
});

// POST /api/places/[placeId]/claim - Revendiquer une place
export async function POST(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { placeId } = params;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    
    // Vérifier que la place existe
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: {
        owner: true
      }
    });
    
    if (!place) {
      return NextResponse.json(
        { error: "Place non trouvée" },
        { status: 404 }
      );
    }
    
    // Vérifier que la place n'est pas déjà revendiquée
    if (place.ownerId) {
      return NextResponse.json(
        { error: "Cette place a déjà un propriétaire" },
        { status: 400 }
      );
    }
    
    // Vérifier qu'il n'y a pas déjà une demande en cours pour cette place
    const existingClaim = await prisma.placeClaim.findFirst({
      where: {
        placeId,
        status: "PENDING"
      }
    });
    
    if (existingClaim) {
      return NextResponse.json(
        { error: "Une demande de revendication est déjà en cours pour cette place" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validatedData = claimSchema.parse(body);
    
    // Créer la demande de revendication
    const claim = await prisma.placeClaim.create({
      data: {
        placeId,
        userId: session.user.id,
        message: validatedData.message,
        proof: validatedData.proof,
        status: "PENDING"
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        place: {
          select: { id: true, name: true, slug: true }
        }
      }
    });
    
    // Envoyer notification à l'admin (en arrière-plan)
    notifyAdminsPlaceClaimed(
      claim.place.name,
      claim.user.name,
      claim.user.email,
      claim.message,
      claim.id
    ).catch(error => {
      console.error("Erreur notification admin:", error);
    });
    
    return NextResponse.json({ 
      claim,
      message: "Votre demande de revendication a été envoyée. Un administrateur va l'examiner."
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Erreur lors de la revendication:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// GET /api/places/[placeId]/claim - Vérifier le statut de revendication
export async function GET(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { placeId } = params;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    
    const place = await prisma.place.findUnique({
      where: { id: placeId }
    });
    
    if (!place) {
      return NextResponse.json(
        { error: "Place non trouvée" },
        { status: 404 }
      );
    }
    
    // Chercher les demandes de revendication de l'utilisateur pour cette place
    const userClaims = await prisma.placeClaim.findMany({
      where: {
        placeId,
        userId: session.user.id
      },
      orderBy: { createdAt: "desc" }
    });
    
    return NextResponse.json({
      canClaim: !place.ownerId,
      isOwner: place.ownerId === session.user.id,
      claims: userClaims
    });
    
  } catch (error) {
    console.error("Erreur lors de la vérification de revendication:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}