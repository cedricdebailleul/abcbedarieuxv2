import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { env } from "@/lib/env";
import ContactAdminEmail from "@/emails/contact-admin-email";
import ContactConfirmationEmail from "@/emails/contact-confirmation-email";

const contactFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Le sujet est requis"),
  company: z.string().optional(),
  message: z.string().min(10, "Le message doit faire au moins 10 caractères"),
  consent: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter la politique de confidentialité",
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactFormSchema.parse(body);

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });

    // Rendu du template admin
    const adminEmailHtml = await render(
      ContactAdminEmail({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        company: validatedData.company,
        subject: validatedData.subject,
        message: validatedData.message,
        receivedAt: new Date().toLocaleString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })
    );

    // Email pour l'administration
    const adminMailOptions = {
      from: env.SMTP_FROM,
      to: env.SMTP_FROM,
      subject: `[Contact ABC] ${validatedData.subject}`,
      html: adminEmailHtml,
    };

    // Rendu du template de confirmation
    const confirmationEmailHtml = await render(
      ContactConfirmationEmail({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        subject: validatedData.subject,
        message: validatedData.message,
        submittedAt: new Date().toLocaleString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })
    );

    // Email de confirmation pour l'utilisateur
    const confirmationMailOptions = {
      from: env.SMTP_FROM,
      to: validatedData.email,
      subject: "Confirmation de réception - ABC Bédarieux",
      html: confirmationEmailHtml,
    };

    // Envoi des emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(confirmationMailOptions),
    ]);

    return NextResponse.json(
      { message: "Message envoyé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
