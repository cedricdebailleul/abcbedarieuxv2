import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import nodemailer from "nodemailer";
import { headers } from "next/headers";

const statusUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PROCESSED"]),
  adminNotes: z.string().optional(),
});

const fullUpdateSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").optional(),
  lastName: z.string().min(1, "Le nom est requis").optional(),
  email: z.string().email("Email invalide").optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  profession: z.string().optional(),
  company: z.string().optional(),
  siret: z.string().optional(),
  membershipType: z.enum(["ACTIF", "ARTISAN", "AUTO_ENTREPRENEUR", "PARTENAIRE", "BIENFAITEUR"]).optional(),
  motivation: z.string().optional(),
  interests: z.string().optional(),
  adminNotes: z.string().optional(),
});

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const registration = await prisma.abcRegistration.findUnique({
      where: { id: params.id },
      include: {
        processorUser: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Inscription non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error("Erreur lors du chargement de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Déterminer le type de mise à jour selon les champs présents
    const isStatusUpdate = body.status !== undefined;
    
    let updateData: any = {};
    
    if (isStatusUpdate) {
      // Mise à jour du statut seulement
      const { status, adminNotes } = statusUpdateSchema.parse(body);
      updateData = {
        status,
        adminNotes,
        processedAt: new Date(),
        processedBy: session.user.id,
      };
    } else {
      // Mise à jour complète des données
      const validatedData = fullUpdateSchema.parse(body);
      const { birthDate, ...restData } = validatedData;
      updateData = {
        ...restData,
        ...(birthDate ? { birthDate: new Date(birthDate as string) } : {}),
        updatedAt: new Date(),
      };
    }

    // Récupérer l'inscription existante
    const existingRegistration = await prisma.abcRegistration.findUnique({
      where: { id: params.id },
    });

    if (!existingRegistration) {
      return NextResponse.json(
        { error: "Inscription non trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour l'inscription
    const updatedRegistration = await prisma.abcRegistration.update({
      where: { id: params.id },
      data: updateData,
      include: {
        processorUser: {
          select: {
            name: true,
          },
        },
      },
    });

    // Si c'est une mise à jour de statut vers APPROVED, créer automatiquement le membre ABC
    if (isStatusUpdate && body.status === "APPROVED") {
      try {
        // Vérifier si l'utilisateur existe déjà
        let user = await prisma.user.findUnique({
          where: { email: existingRegistration.email }
        });

        // Si l'utilisateur n'existe pas, le créer
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: existingRegistration.email,
              name: `${existingRegistration.firstName} ${existingRegistration.lastName}`,
              emailVerified: true, // Considérer comme vérifié puisque approuvé par admin
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
              type: existingRegistration.membershipType as "ACTIF" | "ARTISAN" | "AUTO_ENTREPRENEUR" | "PARTENAIRE" | "BIENFAITEUR",
              memberNumber: memberNumber,
              membershipDate: new Date(),
              status: "ACTIVE",
            }
          });

          console.log(`Membre ABC créé pour ${user.email} avec le numéro ${memberNumber}`);
        }
      } catch (memberError) {
        console.error("Erreur lors de la création du membre ABC:", memberError);
        // Ne pas faire échouer l'approbation si la création du membre échoue
      }
    }

    // Envoyer un email de notification selon le statut
    if (isStatusUpdate && (body.status === "APPROVED" || body.status === "REJECTED")) {
      const isApproved = body.status === "APPROVED";
      
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: existingRegistration.email,
        subject: `${isApproved ? "Inscription approuvée" : "Réponse à votre inscription"} - Association ABC Bédarieux`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'};">
              ${isApproved ? "Félicitations ! Votre inscription a été approuvée" : "Réponse à votre demande d'inscription"}
            </h2>
            
            <p>Bonjour <strong>${existingRegistration.firstName} ${existingRegistration.lastName}</strong>,</p>
            
            ${isApproved ? `
              <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a; margin: 20px 0;">
                <p style="margin: 0; color: #15803d;">
                  <strong>Votre demande d'adhésion à l'Association ABC Bédarieux a été approuvée !</strong>
                </p>
              </div>
              
              <p>Bienvenue dans notre association ! Voici ce qui a été fait :</p>
              
              <ul>
                <li><strong>✅ Votre compte membre a été créé automatiquement</strong></li>
                <li>✅ Vous apparaissez maintenant dans notre annuaire des membres</li>
                <li>✅ Vous recevrez les notifications des bulletins et événements</li>
                <li>✅ Vous avez accès à l'espace association sur notre site</li>
              </ul>
              
              <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Prochaines étapes :</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Connectez-vous sur notre site avec votre adresse email</li>
                  <li>Consultez l'espace association pour voir les derniers bulletins</li>
                  <li>Participez aux prochaines réunions et événements</li>
                </ul>
              </div>
              
              <p>Nous sommes ravis de vous compter parmi nos membres et espérons que vous contribuerez activement à la vie de l'association.</p>
            ` : `
              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b;">
                  Nous avons le regret de vous informer que votre demande d'adhésion n'a pas pu être acceptée pour le moment.
                </p>
              </div>
              
              ${body.adminNotes ? `
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Motif :</strong></p>
                  <p style="margin: 5px 0 0 0;">${body.adminNotes}</p>
                </div>
              ` : ''}
              
              <p>N'hésitez pas à nous recontacter si vous souhaitez plus d'informations ou si votre situation évolue.</p>
            `}
            
            <p style="margin-top: 30px;">
              Cordialement,<br>
              <strong>L'équipe ABC Bédarieux</strong>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              Association ABC Bédarieux - Commerce Local et Artisanat<br>
              Email : contact@abc-bedarieux.fr
            </p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        // Ne pas faire échouer la mise à jour si l'email échoue
      }
    }

    return NextResponse.json(updatedRegistration);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'inscription:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user || !session.user.role || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    await prisma.abcRegistration.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}