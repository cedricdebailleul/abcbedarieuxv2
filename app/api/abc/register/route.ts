import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import { join } from "path";

const registrationSchema = z.object({
  // Informations personnelles
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  commercialName: z.string().optional(),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  
  // Adresse (obligatoire selon le nouveau formulaire)
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, "La ville est requise"),
  postalCode: z.string().min(1, "Le code postal est requis"),
  
  // Site Internet
  website: z.string().optional(),
  
  // Informations professionnelles (optionnelles)
  profession: z.string().optional(),
  company: z.string().optional(),
  siret: z.string().optional(),
  
  // Type de membre
  membershipType: z.enum([
    "ACTIF",
    "ARTISAN",
    "AUTO_ENTREPRENEUR",
    "PARTENAIRE",
    "BIENFAITEUR",
  ]),
  
  // Cotisation
  cotisationAmount: z.number().min(1, "Le montant de cotisation est requis"),
  paymentMethod: z.enum(["CHEQUE", "VIREMENT", "ESPECES"]),
  
  // Motivations (optionnel)
  motivation: z.string().optional(),
  interests: z.array(z.string()).default([]),
  
  // Déclarations et acceptations
  acceptsStatuts: z.boolean().refine(val => val === true, "Vous devez accepter les statuts"),
  acceptsReglement: z.boolean().refine(val => val === true, "Vous devez accepter le règlement"),
  acceptsCotisation: z.boolean().refine(val => val === true, "Vous devez accepter de verser la cotisation"),
});

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

// Fonction pour générer le PDF d'inscription avec design amélioré
function generateRegistrationPDF(
  data: z.infer<typeof registrationSchema>
): Buffer {
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
  addSectionTitle("A REMPLIR PAR LE NOUVEL ADHERENT");
  addSpacer(5);
  
  addField("Nom", data.lastName, true);
  addField("Prénom", data.firstName, true);
  addField("Dénomination commerciale", data.commercialName || "");
  addField("Email", data.email, true);
  addField("Téléphone", data.phone || "");
  addField("Site Internet", data.website || "");
  addField("Date de naissance", data.birthDate || "");

  // === SECTION ADRESSE ===
  addSpacer(10);
  addSectionTitle("ADRESSE");
  addField("Adresse", data.address, true);
  addField("Code postal", data.postalCode, true);
  addField("Ville", data.city, true);

  // === SECTION INFORMATIONS PROFESSIONNELLES ===
  if (data.profession || data.company || data.siret) {
    addSpacer(10);
    addSectionTitle("INFORMATIONS PROFESSIONNELLES");
    addField("Profession", data.profession || "");
    addField("Entreprise", data.company || "");
    addField("SIRET", data.siret || "");
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
  addSpacer(15);
  addSectionTitle("COTISATION");
  
  // Encadré spécial pour le montant
  doc.setFillColor(...COLORS.primaryLight);
  doc.rect(20, yPosition - 3, 60, 10, 'F');
  
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.cotisationAmount}€`, 25, yPosition + 3);
  
  doc.setTextColor(...COLORS.text);
  yPosition += 15;
  
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

  // === SECTION DÉCLARATIONS ===
  addSpacer(15);
  addSectionTitle("DECLARATIONS ET ENGAGEMENTS");
  addSpacer(5);
  
  // Texte explicatif
  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const declarationText = [
    "À ce titre, je déclare reconnaître l'objet de l'association et en avoir accepté",
    "les statuts ainsi que le règlement intérieur qui sont mis à ma disposition sur",
    "demande auprès du bureau. J'ai pris note des droits et des devoirs des membres",
    "de l'association et accepte de verser ma cotisation due pour l'année en cours."
  ];
  
  declarationText.forEach((line) => {
    doc.text(line, 25, yPosition);
    yPosition += 6;
  });
  
  addSpacer(8);
  
  // Cases à cocher stylées
  const checkboxes = [
    "J'accepte les statuts de l'association",
    "J'accepte le règlement intérieur", 
    "J'accepte de verser ma cotisation"
  ];
  
  checkboxes.forEach((checkbox) => {
    doc.setFillColor(...COLORS.success);
    doc.circle(25, yPosition - 1, 2, 'F');
    
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(checkbox, 32, yPosition);
    yPosition += 8;
  });

  // === SECTIONS OPTIONNELLES ===
  if (data.interests && data.interests.length > 0) {
    addSpacer(10);
    addSectionTitle("CENTRES D'INTERET");
    addField("Intérêts", data.interests.join(", "));
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
    doc.text(`Bulletin généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, footerY + 20);

    // Contact dans le footer
    doc.text("Contact : info@abc-bedarieux.fr", pageWidth - 80, footerY + 8, { align: "right" });
    doc.text("Statut : En attente de traitement", pageWidth - 80, footerY + 15, { align: "right" });
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
      where: { email: validatedData.email },
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
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        commercialName: validatedData.commercialName,
        email: validatedData.email,
        phone: validatedData.phone,
        birthDate: validatedData.birthDate,
        address: validatedData.address,
        postalCode: validatedData.postalCode,
        city: validatedData.city,
        website: validatedData.website,
        profession: validatedData.profession,
        company: validatedData.company,
        siret: validatedData.siret,
        membershipType: validatedData.membershipType,
        cotisationAmount: validatedData.cotisationAmount,
        paymentMethod: validatedData.paymentMethod,
        motivation: validatedData.motivation,
        interests: validatedData.interests.join(","),
        acceptsStatuts: validatedData.acceptsStatuts,
        acceptsReglement: validatedData.acceptsReglement,
        acceptsCotisation: validatedData.acceptsCotisation,
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
          
          <p>Bonjour <strong>${validatedData.firstName} ${
        validatedData.lastName
      }</strong>,</p>
          
          <p>Nous avons bien reçu votre demande d'adhésion à l'Association ABC Bédarieux.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Récapitulatif de votre demande :</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Type d'adhésion :</strong> ${
                validatedData.membershipType
              }</li>
              <li><strong>Email :</strong> ${validatedData.email}</li>
              ${
                validatedData.phone
                  ? `<li><strong>Téléphone :</strong> ${validatedData.phone}</li>`
                  : ""
              }
              ${
                validatedData.interests.length > 0
                  ? `<li><strong>Centres d'intérêt :</strong> ${validatedData.interests.join(
                      ", "
                    )}</li>`
                  : ""
              }
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
          contentType: "application/pdf",
        },
      ],
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
              <li><strong>Nom :</strong> ${validatedData.firstName} ${
        validatedData.lastName
      }</li>
              <li><strong>Email :</strong> ${validatedData.email}</li>
              ${
                validatedData.phone
                  ? `<li><strong>Téléphone :</strong> ${validatedData.phone}</li>`
                  : ""
              }
              <li><strong>Type d'adhésion :</strong> ${
                validatedData.membershipType
              }</li>
              ${
                validatedData.motivation
                  ? `<li><strong>Motivation :</strong> ${validatedData.motivation}</li>`
                  : ""
              }
            </ul>
          </div>
          
          <p style="margin-top: 20px;">
            <a href="${
              process.env.NEXT_PUBLIC_SITE_URL
            }/dashboard/admin/abc/registrations" 
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
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(adminMailOptions);

    return NextResponse.json({
      success: true,
      message: "Inscription envoyée avec succès",
      registrationId: registration.id,
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription ABC:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'inscription. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
