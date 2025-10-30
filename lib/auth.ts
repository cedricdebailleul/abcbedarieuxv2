import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { magicLink } from "better-auth/plugins/magic-link";
import { createAuthMiddleware } from "better-auth/api";
import { sendEmail, sendEmailOTP } from "./mailer";
import { prisma } from "./prisma";
import { triggerUserRegistrationBadges, triggerProfileUpdateBadges } from "./services/badge-trigger-service";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { email: string; name?: string };
      url: string;
    }) => {
      // Vérifier si on doit ignorer l'envoi d'email (pour les invitations)
      if (process.env.SKIP_VERIFICATION_EMAIL === "true") {
        if (process.env.NODE_ENV !== "production") {
          console.log("🔧 [BETTER AUTH] Envoi d'email ignoré pour invitation:", {
            email: user.email,
          });
        }
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(
          "🔧 [BETTER AUTH] Tentative d'envoi d'email de vérification:",
          {
            email: user.email,
            url: "[URL masquée en production]",
          }
        );
      }

      try {
        await sendEmail({
          to: user.email,
          subject: "ABC Bédarieux - Vérifiez votre email",
          html: `
            <h2>Vérification de votre email</h2>
            <p>Bonjour ${user.name || user.email},</p>
            <p>Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
            <a href="${url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Vérifier mon email
            </a>
            <p>Ce lien est valide pendant 24 heures.</p>
            <p>Si vous n'avez pas créé de compte sur ABC Bédarieux, ignorez ce message.</p>
          `,
        });
        if (process.env.NODE_ENV !== "production") {
          console.log(
            "✅ [BETTER AUTH] Email de vérification envoyé avec succès"
          );
        }
      } catch (error) {
        console.error("❌ [BETTER AUTH] Erreur lors de l'envoi de l'email de vérification");
        if (process.env.NODE_ENV !== "production") {
          console.error("Détails:", error);
        }
        throw error;
      }
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        await sendEmail({
          to: email,
          subject: "ABC Bédarieux - Lien de connexion magique",
          html: `
            <h2>Connexion rapide</h2>
            <p>Cliquez sur le lien ci-dessous pour vous connecter automatiquement :</p>
            <a href="${url}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Se connecter maintenant
            </a>
            <p>Ce lien est valide pendant 10 minutes et ne peut être utilisé qu'une seule fois.</p>
            <p>Si vous n'avez pas demandé cette connexion, ignorez ce message.</p>
          `,
        });
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendEmailOTP(email, otp);
      },
    }),
    admin(),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      try {
        // Déclencher les badges lors de l'inscription
        if (ctx.path === "/sign-up/email" && ctx.context.newSession) {
          const userId = ctx.context.newSession.user.id;
          if (process.env.NODE_ENV !== "production") {
            console.log(`🎖️ Triggering registration badges for new user: ${userId}`);
          }
          await triggerUserRegistrationBadges(userId);
        }

        // Déclencher les badges lors de la mise à jour du profil
        if (ctx.path === "/update-user" && ctx.context.session) {
          const userId = ctx.context.session.user.id;
          if (process.env.NODE_ENV !== "production") {
            console.log(`🎖️ Triggering profile update badges for user: ${userId}`);
          }
          await triggerProfileUpdateBadges(userId);
        }

        // Déclencher les badges lors de la première connexion (vérification email)
        if (ctx.path === "/verify-email" && ctx.context.newSession) {
          const userId = ctx.context.newSession.user.id;
          if (process.env.NODE_ENV !== "production") {
            console.log(`🎖️ Triggering email verification badges for user: ${userId}`);
          }
          await triggerProfileUpdateBadges(userId);
        }
        
      } catch (error) {
        console.error("❌ Error triggering badges in auth hooks:", error);
        // Ne pas faire échouer l'authentification si les badges échouent
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
