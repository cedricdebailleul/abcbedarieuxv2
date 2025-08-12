import nodemailer from "nodemailer";
import { env } from "./env";

export const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT as unknown as number,
  secure: true,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASS,
  },
});

export async function sendEmailOTP(email: string, otp: string) {
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
