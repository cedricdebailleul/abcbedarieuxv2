import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";

const manualRegistrationSchema = z.object({
  userId: z.string().optional(), // ID utilisateur existant (optionnel)
  // Informations utilisateur (obligatoires si pas d'userId)
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  profession: z.string().optional(),
  company: z.string().optional(),
  siret: z.string().optional(),
  membershipType: z.enum(["ACTIF", "ARTISAN", "AUTO_ENTREPRENEUR", "PARTENAIRE", "BIENFAITEUR"]),
  motivation: z.string().optional(),
  interests: z.array(z.string()),
  // Options admin
  autoApprove: z.boolean().default(false), // Approuver automatiquement
  adminNotes: z.string().optional(), // Notes administratives
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = manualRegistrationSchema.parse(body);

    let userEmail = validatedData.email;
    let userFirstName = validatedData.firstName;
    let userLastName = validatedData.lastName;

    // Si un userId est fourni, récupérer les informations de l'utilisateur
    if (validatedData.userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: validatedData.userId },
        select: {
          email: true,
          name: true,
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }

      userEmail = existingUser.email;
      // Essayer de séparer le nom complet en prénom/nom
      const nameParts = existingUser.name?.split(' ') || [];
      userFirstName = nameParts[0] || validatedData.firstName;
      userLastName = nameParts.slice(1).join(' ') || validatedData.lastName;
    }

    // Vérifier si une inscription existe déjà pour cet email
    const existingRegistration = await prisma.abcRegistration.findFirst({
      where: { email: userEmail }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Une inscription existe déjà pour cet email" },
        { status: 400 }
      );
    }

    // Créer l'inscription
    const registration = await prisma.abcRegistration.create({
      data: {
        firstName: userFirstName,
        lastName: userLastName,
        email: userEmail,
        phone: validatedData.phone,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
        address: validatedData.address,
        city: validatedData.city,
        postalCode: validatedData.postalCode,
        profession: validatedData.profession,
        company: validatedData.company,
        siret: validatedData.siret,
        membershipType: validatedData.membershipType,
        motivation: validatedData.motivation,
        interests: validatedData.interests.join(","),
        status: validatedData.autoApprove ? "APPROVED" : "PENDING",
        adminNotes: validatedData.adminNotes,
        ...(validatedData.autoApprove && {
          processedAt: new Date(),
          processedBy: session.user.id,
        }),
      },
    });

    // Si auto-approuvé, créer le membre ABC automatiquement
    if (validatedData.autoApprove) {
      try {
        // Vérifier si l'utilisateur existe déjà
        let user = await prisma.user.findUnique({
          where: { email: userEmail }
        });

        // Si l'utilisateur n'existe pas, le créer
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: userEmail,
              name: `${userFirstName} ${userLastName}`,
              emailVerified: new Date(), // Considérer comme vérifié puisque créé par admin
            }
          });
        }

        // Vérifier si le membre ABC existe déjà
        const existingMember = await prisma.abcMember.findUnique({
          where: { userId: user.id }
        });

        if (!existingMember) {
          // Générer un numéro de membre unique
          const memberCount = await prisma.abcMember.count();
          const memberNumber = `ABC${String(memberCount + 1).padStart(4, '0')}`;

          // Créer le membre ABC
          await prisma.abcMember.create({
            data: {
              userId: user.id,
              type: validatedData.membershipType as any,
              memberNumber: memberNumber,
              membershipDate: new Date(),
              status: "ACTIVE",
            }
          });

          console.log(`Membre ABC créé automatiquement par admin pour ${user.email} avec le numéro ${memberNumber}`);
        }
      } catch (memberError) {
        console.error("Erreur lors de la création automatique du membre ABC:", memberError);
        // Ne pas faire échouer la création de l'inscription
      }
    }

    return NextResponse.json({
      success: true,
      message: validatedData.autoApprove 
        ? "Inscription créée et approuvée automatiquement" 
        : "Inscription créée avec succès",
      registration: {
        id: registration.id,
        status: registration.status,
        email: registration.email,
        firstName: registration.firstName,
        lastName: registration.lastName,
      }
    });

  } catch (error) {
    console.error("Erreur lors de la création de l'inscription manuelle:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de l'inscription" },
      { status: 500 }
    );
  }
}