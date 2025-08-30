import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";
import { headers } from "next/headers";
import { readFileSync } from "fs";
import { join } from "path";

// Couleurs du thème shadcn (en RGB pour jsPDF)
const COLORS = {
  primary: [37, 99, 235], // blue-600
  primaryLight: [219, 234, 254], // blue-100
  accent: [99, 102, 241], // indigo-500
  text: [15, 23, 42], // slate-900
  textMuted: [100, 116, 139], // slate-500
  border: [226, 232, 240], // slate-200
  background: [248, 250, 252], // slate-50
  success: [34, 197, 94], // green-500
} as const;

// Interface pour les données d'inscription
interface RegistrationData {
  lastName: string;
  firstName: string;
  commercialName?: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string;
  profession?: string;
  company?: string;
  siret?: string;
  membershipType: string;
  cotisationAmount?: number;
  paymentMethod?: string;
  interests?: string;
  motivation?: string;
  status: string;
  processedAt?: string;
  processorUser?: { name: string };
  adminNotes?: string;
  createdAt: string;
  acceptsStatuts?: boolean;
  acceptsReglement?: boolean;
  acceptsCotisation?: boolean;
}

function generateRegistrationPDF(data: RegistrationData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // === HEADER AVEC STYLE MODERNE ===
  // Fond coloré pour l'en-tête
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Logo ABC (image PNG)
  try {
    const logoPath = join(process.cwd(), 'public', 'images', 'logo_abc.png');
    const logoBuffer = readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    
    // Ajouter l'image au PDF
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 15, 12, 20, 20);
  } catch (error) {
    console.error('Erreur lors du chargement du logo:', error);
    // Fallback: texte "ABC" si l'image ne charge pas
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ABC", 20, 25);
  }
  
  // Titre principal
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Association ABC Bédarieux", 55, 20);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Bulletin d'Inscription", 55, 30);
  
  // Date de génération
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 60, 15);

  // Bande décorative
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 45, pageWidth, 3, 'F');

  // Reset couleur du texte
  doc.setTextColor(...COLORS.text);
  let yPosition = 65;

  // === FONCTIONS UTILITAIRES POUR LE STYLE ===
  const checkPageSpace = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 60) { // Laisser de la place pour le footer
      doc.addPage();
      yPosition = 30;
    }
  };

  const addSectionTitle = (title: string) => {
    checkPageSpace(25); // S'assurer qu'on a de la place pour le titre
    
    // Fond coloré pour le titre de section
    doc.setFillColor(...COLORS.primaryLight);
    doc.rect(15, yPosition - 5, pageWidth - 30, 12, 'F');
    
    // Bordure gauche colorée
    doc.setFillColor(...COLORS.primary);
    doc.rect(15, yPosition - 5, 4, 12, 'F');
    
    // Texte du titre
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 25, yPosition + 2);
    
    doc.setTextColor(...COLORS.text);
    yPosition += 18;
  };

  const addField = (label: string, value: string, isHighlight = false) => {
    if (value && value.trim()) {
      doc.setFontSize(10);
      
      if (isHighlight) {
        // Fond léger pour les champs importants
        doc.setFillColor(...COLORS.background);
        doc.rect(20, yPosition - 3, pageWidth - 40, 8, 'F');
      }
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`${label}:`, 25, yPosition);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      doc.text(value, 80, yPosition);
      
      yPosition += 8;
    }
  };

  const addSpacer = (height = 10) => {
    yPosition += height;
  };

  // === SECTION INFORMATIONS PERSONNELLES ===
  addSectionTitle("INFORMATIONS PERSONNELLES");
  addSpacer(5);
  
  addField("Nom", data.lastName, true);
  addField("Prénom", data.firstName, true);
  if (data.commercialName) addField("Dénomination commerciale", data.commercialName);
  addField("Email", data.email, true);
  if (data.phone) addField("Téléphone", data.phone);
  if (data.website) addField("Site Internet", data.website);
  if (data.birthDate) {
    const birthDateStr = typeof data.birthDate === 'string' 
      ? data.birthDate 
      : new Date(data.birthDate).toLocaleDateString('fr-FR');
    addField("Date de naissance", birthDateStr);
  }

  // === SECTION ADRESSE ===
  if (data.address || data.city || data.postalCode) {
    addSpacer(10);
    addSectionTitle("ADRESSE");
    if (data.address) addField("Adresse", data.address, true);
    if (data.postalCode) addField("Code postal", data.postalCode, true);
    if (data.city) addField("Ville", data.city, true);
  }

  // === SECTION INFORMATIONS PROFESSIONNELLES ===
  if (data.profession || data.company || data.siret) {
    addSpacer(10);
    addSectionTitle("INFORMATIONS PROFESSIONNELLES");
    if (data.profession) addField("Profession", data.profession);
    if (data.company) addField("Entreprise", data.company);
    if (data.siret) addField("SIRET", data.siret);
  }

  // === SECTION TYPE D'ADHÉSION ===
  addSpacer(15);
  addSectionTitle("TYPE D'ADHESION");
  
  const membershipTypes = {
    ACTIF: "Membre Actif (120€)",
    ARTISAN: "Membre Actif Artisan (60€)",
    AUTO_ENTREPRENEUR: "Membre Actif Auto-Entrepreneur (60€)",
    PARTENAIRE: "Membre Partenaire (minimum 60€)",
    BIENFAITEUR: "Membre Bienfaiteur (cotisation libre)",
  };
  
  const selectedType = membershipTypes[data.membershipType as keyof typeof membershipTypes];
  
  // Encadré spécial pour le type d'adhésion
  doc.setFillColor(...COLORS.success);
  doc.rect(20, yPosition - 3, pageWidth - 40, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`✓ ${selectedType}`, 25, yPosition + 4);
  
  doc.setTextColor(...COLORS.text);
  yPosition += 18;

  // === SECTION COTISATION ===
  if (data.cotisationAmount || data.paymentMethod) {
    addSpacer(15);
    addSectionTitle("COTISATION");
    
    if (data.cotisationAmount) {
      // Encadré spécial pour le montant
      doc.setFillColor(...COLORS.primaryLight);
      doc.rect(20, yPosition - 3, 60, 10, 'F');
      
      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${data.cotisationAmount}€`, 25, yPosition + 3);
      
      doc.setTextColor(...COLORS.text);
      yPosition += 15;
    }
    
    if (data.paymentMethod) {
      const paymentMethods = {
        CHEQUE: "Chèque",
        VIREMENT: "Virement",
        ESPECES: "Espèces",
      };
      
      addField("Mode de paiement", paymentMethods[data.paymentMethod as keyof typeof paymentMethods]);
      addSpacer(5);
      
      // Vérifier qu'on a assez de place pour les infos bancaires
      checkPageSpace(30);
      
      // Encadré pour les informations bancaires
      doc.setFillColor(...COLORS.background);
      doc.rect(20, yPosition - 3, pageWidth - 40, 25, 'F');
      
      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Informations bancaires :", 25, yPosition + 2);
      
      doc.setTextColor(...COLORS.text);
      doc.setFont("helvetica", "normal");
      doc.text("IBAN: FR76 1005 7190 4300 0142 6820 108", 25, yPosition + 10);
      doc.text("CODE BIC: CMCIFR", 25, yPosition + 18);
      
      yPosition += 30;
    }
  }

  // === SECTIONS OPTIONNELLES ===
  if (data.interests) {
    addSpacer(10);
    addSectionTitle("CENTRES D'INTERET");
    addField("Intérêts", data.interests);
  }

  if (data.motivation) {
    addSpacer(10);
    addSectionTitle("MOTIVATION");
    
    // Texte de motivation dans un encadré
    doc.setFillColor(...COLORS.background);
    doc.rect(20, yPosition - 3, pageWidth - 40, 25, 'F');
    
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Découper le texte en lignes
    const motivationLines = doc.splitTextToSize(data.motivation, pageWidth - 50);
    motivationLines.slice(0, 3).forEach((line: string, index: number) => {
      doc.text(line, 25, yPosition + (index * 6) + 2);
    });
    
    yPosition += 30;
  }

  // === SECTION STATUT ADMIN ===
  addSpacer(15);
  addSectionTitle("STATUT DE LA DEMANDE");
  
  const statusLabels = {
    PENDING: "En attente",
    APPROVED: "Approuvé", 
    REJECTED: "Rejeté",
    PROCESSED: "Traité",
  };
  
  const statusColor: readonly [number, number, number] = data.status === 'APPROVED' ? COLORS.success : 
                     data.status === 'REJECTED' ? [239, 68, 68] as const : // red-500
                     COLORS.accent;
  
  // Encadré coloré pour le statut
  doc.setFillColor(...statusColor);
  doc.rect(20, yPosition - 3, pageWidth - 40, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Statut: ${statusLabels[data.status as keyof typeof statusLabels]}`, 25, yPosition + 4);
  
  doc.setTextColor(...COLORS.text);
  yPosition += 18;
  
  if (data.processedAt) {
    const processedDateStr = typeof data.processedAt === 'string' 
      ? new Date(data.processedAt).toLocaleDateString('fr-FR')
      : new Date(data.processedAt).toLocaleDateString('fr-FR');
    addField("Traité le", processedDateStr);
  }
  
  if (data.processorUser?.name) {
    addField("Traité par", data.processorUser.name);
  }
  
  if (data.adminNotes) {
    addSpacer(5);
    addSectionTitle("NOTES ADMINISTRATIVES");
    
    doc.setFillColor(...COLORS.background);
    doc.rect(20, yPosition - 3, pageWidth - 40, 20, 'F');
    
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const notesLines = doc.splitTextToSize(data.adminNotes, pageWidth - 50);
    notesLines.slice(0, 2).forEach((line: string, index: number) => {
      doc.text(line, 25, yPosition + (index * 6) + 2);
    });
    
    yPosition += 25;
  }

  // === FOOTER MODERNE - SEULEMENT SUR LA DERNIÈRE PAGE ===
  const addFooter = () => {
    const footerY = pageHeight - 45;
    
    // Ligne de séparation
    doc.setDrawColor(...COLORS.border);
    doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);

    // Footer avec fond coloré
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, footerY - 5, pageWidth, 40, 'F');

    // Informations du footer
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Association ABC Bédarieux", 20, footerY + 5);
    doc.text("Commerce Local & Artisanat", 20, footerY + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const createdDateStr = typeof data.createdAt === 'string'
      ? new Date(data.createdAt).toLocaleDateString('fr-FR')
      : new Date(data.createdAt).toLocaleDateString('fr-FR');
    doc.text(`Demande du ${createdDateStr}`, 20, footerY + 20);

    // Contact dans le footer
    doc.text("Contact : info@abc-bedarieux.fr", pageWidth - 80, footerY + 8, { align: "right" });
  };

  // S'assurer qu'on a assez d'espace pour le footer ou créer une nouvelle page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 30;
  }
  
  // Ajouter le footer seulement sur la dernière page
  addFooter();

  // Retourner le PDF en tant que Buffer
  const pdfOutput = doc.output("arraybuffer");
  return Buffer.from(pdfOutput);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session?.user ||
      !safeUserCast(session.user).role ||
      !["admin", "moderator"].includes(safeUserCast(session.user).role)
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const registration = await prisma.abcRegistration.findUnique({
      where: { id },
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
    const pdfBuffer = generateRegistrationPDF({
      ...registration,
      commercialName: registration.commercialName ?? undefined,
      phone: registration.phone ?? undefined,
      birthDate: registration.birthDate
        ? registration.birthDate.toString()
        : undefined,
      address: registration.address ?? undefined,
      city: registration.city ?? undefined,
      postalCode: registration.postalCode ?? undefined,
      website: registration.website ?? undefined,
      profession: registration.profession ?? undefined,
      company: registration.company ?? undefined,
      siret: registration.siret ?? undefined,
      cotisationAmount: registration.cotisationAmount ?? undefined,
      paymentMethod: registration.paymentMethod ?? undefined,
      interests: registration.interests ?? undefined,
      motivation: registration.motivation ?? undefined,
      processedAt: registration.processedAt
        ? registration.processedAt.toISOString()
        : undefined,
      processorUser: registration.processorUser ?? undefined,
      adminNotes: registration.adminNotes ?? undefined,
      createdAt: registration.createdAt.toISOString(),
      acceptsStatuts: registration.acceptsStatuts ?? undefined,
      acceptsReglement: registration.acceptsReglement ?? undefined,
      acceptsCotisation: registration.acceptsCotisation ?? undefined,
    });

    // Retourner le PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="inscription-abc-${registration.lastName}-${registration.firstName}.pdf"`,
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
