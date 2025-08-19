import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  // Statut et notes admin
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUT DE LA DEMANDE', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const statusLabels = {
    PENDING: "En attente",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
    PROCESSED: "Traité"
  };
  doc.text(`Statut: ${statusLabels[data.status as keyof typeof statusLabels]}`, 20, yPosition);
  yPosition += 7;
  
  if (data.processedAt) {
    doc.text(`Traité le: ${new Date(data.processedAt).toLocaleDateString('fr-FR')}`, 20, yPosition);
    yPosition += 7;
  }
  
  if (data.processorUser?.name) {
    doc.text(`Traité par: ${data.processorUser.name}`, 20, yPosition);
    yPosition += 7;
  }
  
  if (data.adminNotes) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes administratives:', 20, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(data.adminNotes, 170);
    doc.text(notesLines, 20, yPosition);
    yPosition += notesLines.length * 7;
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

    // Générer le PDF
    const pdfBuffer = generateRegistrationPDF(registration);

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="inscription-abc-${registration.lastName}-${registration.firstName}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}