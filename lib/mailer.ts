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
    from: `LMS Course <${env.MAIL_USER}>`,
    to: email,
    subject: "MarshalLMS, verify your email",
    html: `
      <h2>Verification Code</h2>
      <p>Your code is: <strong>${otp}</strong></p>
      <p>This code is valid for 15 minutes.</p>
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
  const mailOptions = {
    from: `LMS Course <${env.MAIL_USER}>`,
    to,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
}
