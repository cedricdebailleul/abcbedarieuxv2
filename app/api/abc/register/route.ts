import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";

const registrationSchema = z.object({
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
});

// Fonction pour générer le PDF d'inscription
function generateRegistrationPDF(data: any): Buffer {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(20);
  doc.text('Association ABC Bédarieux', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Bulletin d\'Inscription', 105, 30, { align: 'center' });

  let yPosition = 50;

  // Informations personnelles
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS PERSONNELLES', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom: ${data.lastName}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Prénom: ${data.firstName}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Email: ${data.email}`, 20, yPosition);
  yPosition += 7;
  
  if (data.phone) {
    doc.text(`Téléphone: ${data.phone}`, 20, yPosition);
    yPosition += 7;
  }
  
  if (data.birthDate) {
    doc.text(`Date de naissance: ${new Date(data.birthDate).toLocaleDateString('fr-FR')}`, 20, yPosition);
    yPosition += 7;
  }
  
  yPosition += 10;

  // Adresse
  if (data.address || data.city || data.postalCode) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ADRESSE', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (data.address) {
      doc.text(`Adresse: ${data.address}`, 20, yPosition);
      yPosition += 7;
    }
    if (data.postalCode) {
      doc.text(`Code postal: ${data.postalCode}`, 20, yPosition);
      yPosition += 7;
    }
    if (data.city) {
      doc.text(`Ville: ${data.city}`, 20, yPosition);
      yPosition += 7;
    }
    yPosition += 10;
  }

  // Informations professionnelles
  if (data.profession || data.company || data.siret) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS PROFESSIONNELLES', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (data.profession) {
      doc.text(`Profession: ${data.profession}`, 20, yPosition);
      yPosition += 7;
    }
    if (data.company) {
      doc.text(`Entreprise: ${data.company}`, 20, yPosition);
      yPosition += 7;
    }
    if (data.siret) {
      doc.text(`SIRET: ${data.siret}`, 20, yPosition);
      yPosition += 7;
    }
    yPosition += 10;
  }

  // Type d'adhésion
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TYPE D\'ADHÉSION', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const membershipTypes = {
    ACTIF: "Membre Actif",
    ARTISAN: "Artisan",
    AUTO_ENTREPRENEUR: "Auto-Entrepreneur",
    PARTENAIRE: "Partenaire",
    BIENFAITEUR: "Bienfaiteur"
  };
  doc.text(`Type d'adhésion: ${membershipTypes[data.membershipType as keyof typeof membershipTypes]}`, 20, yPosition);
  yPosition += 10;

  // Centres d'intérêt
  if (data.interests && data.interests.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CENTRES D\'INTÉRÊT', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Centres d'intérêt: ${data.interests.join(', ')}`, 20, yPosition);
    yPosition += 10;
  }

  // Motivation
  if (data.motivation) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MOTIVATION', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(data.motivation, 170);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * 7 + 10;
  }

  // Pied de page
  yPosition += 20;
  doc.setFontSize(10);
  doc.text(`Date de demande: ${new Date().toLocaleDateString('fr-FR')}`, 105, yPosition, { align: 'center' });
  yPosition += 7;
  doc.text('Association ABC Bédarieux - Commerce Local et Artisanat', 105, yPosition, { align: 'center' });

  // Retourner le PDF en tant que Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des données
    const validatedData = registrationSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existingRegistration = await prisma.abcRegistration.findFirst({
      where: { email: validatedData.email }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Une demande d'inscription existe déjà pour cet email" },
        { status: 400 }
      );
    }

    // Générer le PDF
    const pdfBuffer = generateRegistrationPDF(validatedData);
    
    // Créer l'enregistrement en base
    const registration = await prisma.abcRegistration.create({
      data: {
        ...validatedData,
        interests: validatedData.interests.join(","),
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
      },
    });

    // Envoyer l'email avec le PDF en pièce jointe
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: validatedData.email,
      subject: "Confirmation d'inscription - Association ABC Bédarieux",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Confirmation d'inscription</h2>
          
          <p>Bonjour <strong>${validatedData.firstName} ${validatedData.lastName}</strong>,</p>
          
          <p>Nous avons bien reçu votre demande d'adhésion à l'Association ABC Bédarieux.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Récapitulatif de votre demande :</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Type d'adhésion :</strong> ${validatedData.membershipType}</li>
              <li><strong>Email :</strong> ${validatedData.email}</li>
              ${validatedData.phone ? `<li><strong>Téléphone :</strong> ${validatedData.phone}</li>` : ''}
              ${validatedData.interests.length > 0 ? `<li><strong>Centres d'intérêt :</strong> ${validatedData.interests.join(', ')}</li>` : ''}
            </ul>
          </div>
          
          <p>Vous trouverez en pièce jointe votre bulletin d'inscription au format PDF.</p>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0;"><strong>Prochaines étapes :</strong></p>
            <p style="margin: 5px 0 0 0;">Votre demande va être examinée par notre équipe. Nous vous recontacterons sous 48 heures pour confirmer votre adhésion.</p>
          </div>
          
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
      attachments: [
        {
          filename: `inscription-abc-${validatedData.lastName}-${validatedData.firstName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    // Envoyer également une notification à l'admin
    const adminMailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Email admin
      subject: "Nouvelle demande d'inscription ABC Bédarieux",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Nouvelle demande d'inscription</h2>
          
          <p>Une nouvelle demande d'adhésion a été reçue :</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0;">Informations du candidat :</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Nom :</strong> ${validatedData.firstName} ${validatedData.lastName}</li>
              <li><strong>Email :</strong> ${validatedData.email}</li>
              ${validatedData.phone ? `<li><strong>Téléphone :</strong> ${validatedData.phone}</li>` : ''}
              <li><strong>Type d'adhésion :</strong> ${validatedData.membershipType}</li>
              ${validatedData.motivation ? `<li><strong>Motivation :</strong> ${validatedData.motivation}</li>` : ''}
            </ul>
          </div>
          
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/admin/abc/registrations" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Voir dans l'administration
            </a>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `inscription-abc-${validatedData.lastName}-${validatedData.firstName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(adminMailOptions);

    return NextResponse.json({
      success: true,
      message: "Inscription envoyée avec succès",
      registrationId: registration.id
    });

  } catch (error) {
    console.error("Erreur lors de l'inscription ABC:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'inscription. Veuillez réessayer." },
      { status: 500 }
    );
  }
}