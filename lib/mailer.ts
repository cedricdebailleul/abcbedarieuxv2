import nodemailer from "nodemailer";
import { env } from "./env";

// Vérifier si les variables MAIL sont configurées
const isMailConfigured = Boolean(
  env.MAIL_HOST &&
  env.MAIL_PORT &&
  env.MAIL_USER &&
  env.MAIL_PASS
);

export const transporter = isMailConfigured
  ? nodemailer.createTransport({
      host: env.MAIL_HOST!,
      port: env.MAIL_PORT as unknown as number,
      secure: true,
      auth: {
        user: env.MAIL_USER!,
        pass: env.MAIL_PASS!,
      },
    })
  : null;

export async function sendEmailOTP(email: string, otp: string) {
  if (!transporter) {
    console.error("❌ [MAILER] Configuration email manquante pour OTP");
    console.log("📧 [MAILER] OTP non envoyé :", { email, otp });

    if (process.env.NODE_ENV !== "production") {
      return { messageId: "dev-mock-otp-id" };
    }

    throw new Error("Configuration email manquante");
  }

  const mailOptions = {
    from: `ABC Bédarieux <${env.MAIL_USER}>`,
    to: email,
    subject: "ABC Bédarieux - Code de vérification",
    html: `
      <h2>Code de vérification</h2>
      <p>Votre code de vérification est : <strong>${otp}</strong></p>
      <p>Ce code est valide pendant 15 minutes.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!transporter) {
    console.error("❌ [MAILER] Configuration email manquante (MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS)");
    console.log("📧 [MAILER] Email non envoyé (mode développement) :", {
      to,
      subject,
      htmlPreview: html.substring(0, 100) + "...",
    });

    // En développement, ne pas bloquer, juste logger
    if (process.env.NODE_ENV !== "production") {
      return { messageId: "dev-mock-message-id" };
    }

    throw new Error(
      "Configuration email manquante. Veuillez configurer les variables MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS."
    );
  }

  console.log("🔧 [MAILER] Tentative d'envoi d'email:", {
    to,
    subject,
    from: `ABC Bédarieux <${env.MAIL_USER}>`,
    mailHost: env.MAIL_HOST,
    mailPort: env.MAIL_PORT,
  });

  const mailOptions = {
    from: `ABC Bédarieux <${env.MAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ [MAILER] Email envoyé avec succès:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ [MAILER] Erreur lors de l'envoi:", error);
    throw error;
  }
}
