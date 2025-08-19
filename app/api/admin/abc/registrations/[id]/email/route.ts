import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";
import { headers } from "next/headers";

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
  if (data.interests) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CENTRES D\'INTÉRÊT', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Centres d'intérêt: ${data.interests}`, 20, yPosition);
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
  doc.text(`Date de demande: ${new Date(data.createdAt).toLocaleDateString('fr-FR')}`, 105, yPosition, { align: 'center' });
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

export async function POST(
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

    // Générer le PDF
    const pdfBuffer = generateRegistrationPDF(registration);

    // Préparer le contenu de l'email selon le statut
    let subject = "Rappel - Votre inscription à l'Association ABC Bédarieux";
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Rappel de votre inscription</h2>
        
        <p>Bonjour <strong>${registration.firstName} ${registration.lastName}</strong>,</p>
        
        <p>Nous vous renvoyons une copie de votre bulletin d'inscription à l'Association ABC Bédarieux.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Statut actuel de votre demande :</h3>
          <p style="margin: 0;"><strong>Statut :</strong> ${
            registration.status === "PENDING" ? "En attente de traitement" :
            registration.status === "APPROVED" ? "Approuvée ✓" :
            registration.status === "REJECTED" ? "Rejetée" :
            "Traitée"
          }</p>
          ${registration.processedAt ? `<p style="margin: 5px 0 0 0;"><strong>Traité le :</strong> ${new Date(registration.processedAt).toLocaleDateString('fr-FR')}</p>` : ''}
        </div>
        
        <p>Vous trouverez en pièce jointe votre bulletin d'inscription complet au format PDF.</p>
        
        ${registration.status === "PENDING" ? `
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0;"><strong>Information :</strong></p>
            <p style="margin: 5px 0 0 0;">Votre demande est en cours d'examen. Nous vous recontacterons sous peu.</p>
          </div>
        ` : ''}
        
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
    `;

    // Envoyer l'email avec le PDF en pièce jointe
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: registration.email,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: `inscription-abc-${registration.lastName}-${registration.firstName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email envoyé avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}