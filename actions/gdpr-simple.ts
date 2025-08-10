"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/mailer";
import { redirect } from "next/navigation";

// Schemas simples
const ConsentSchema = z.object({
  cookies: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
});

const GDPRRequestSchema = z.object({
  type: z.enum([
    "DATA_EXPORT",
    "DATA_DELETE",
    "DATA_CORRECT",
    "COMPLAINT",
    "OTHER",
  ]),
  email: z.string().email(),
  message: z.string().min(10, "Message trop court"),
});

async function getClientIP() {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

export async function updateConsentAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { errors: { general: ["Non authentifié"] } };
  }

  const validatedFields = ConsentSchema.safeParse({
    cookies: formData.get("cookies") === "true",
    analytics: formData.get("analytics") === "true",
    marketing: formData.get("marketing") === "true",
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const consent = validatedFields.data;
    const ipAddress = await getClientIP();

    // Récupérer le consentement existant pour l'historique
    const existing = await prisma.userConsent.findUnique({
      where: { userId: session.user.id },
    });

    // Préparer l'historique
    const historyEntry = {
      date: new Date().toISOString(),
      action: existing ? "updated" : "created",
      ipAddress,
      previous: existing
        ? {
            cookies: existing.cookies,
            analytics: existing.analytics,
            marketing: existing.marketing,
          }
        : null,
      new: consent,
    };

    // Mettre à jour ou créer le consentement
    await prisma.userConsent.upsert({
      where: { userId: session.user.id },
      update: {
        ...consent,
        consentDate: new Date(),
        ipAddress,
        history: existing?.history
          ? [...(existing.history as any[]), historyEntry]
          : [historyEntry],
      },
      create: {
        userId: session.user.id,
        ...consent,
        ipAddress,
        history: [historyEntry],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Consent update error:", error);
    return {
      errors: { general: ["Erreur lors de la mise à jour"] },
    };
  }
}

export async function createGDPRRequestAction(formData: FormData) {
  const validatedFields = GDPRRequestSchema.safeParse({
    type: formData.get("type"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { type, email, message } = validatedFields.data;

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    const request = await prisma.gDPRRequest.create({
      data: {
        type,
        email,
        message,
        userId: user?.id,
      },
    });

    // TODO: Envoyer email de confirmation à l'utilisateur

    // TODO: Notifier les admins
    // Après la création d'une demande RGPD
    if (process.env.GDPR_NOTIFICATION_EMAIL) {
      await sendEmail({
        to: process.env.GDPR_NOTIFICATION_EMAIL,
        subject: `Nouvelle demande RGPD - ${type}`,
        html: `
      <h2>Nouvelle demande RGPD</h2>
      <p><strong>Type:</strong> ${type}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>ID:</strong> ${request.id}</p>
    `,
      });
    }

    return {
      success: true,
      requestId: request.id,
    };
  } catch (error) {
    console.error("GDPR request error:", error);
    return {
      errors: { general: ["Erreur lors de la création de la demande"] },
    };
  }
}

export async function exportUserDataAction() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { errors: { general: ["Non authentifié"] } };
  }

  try {
    // Récupérer toutes les données utilisateur
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        consent: true,
        // posts: {
        //   select: {
        //     id: true,
        //     title: true,
        //     slug: true,
        //     published: true,
        //     createdAt: true,
        //   },
        // },
        accounts: {
          select: {
            providerId: true,
          },
        },
        gdprRequests: {
          select: {
            id: true,
            type: true,
            status: true,
            requestDate: true,
          },
        },
      },
    });

    if (!userData) {
      return { errors: { general: ["Utilisateur non trouvé"] } };
    }

    // Créer une demande RGPD pour traçabilité
    await prisma.gDPRRequest.create({
      data: {
        type: "DATA_EXPORT",
        email: userData.email,
        userId: userData.id,
        message: "Export automatique des données",
        status: "COMPLETED",
        processedDate: new Date(),
        response: "Données exportées avec succès",
      },
    });

    // Construire l'export simplifié
    const exportData = {
      exportInfo: {
        date: new Date().toISOString(),
        version: "1.0",
        userId: userData.id,
      },
      personalData: {
        profile: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          createdAt: userData.createdAt,
        },
        consent: userData.consent,
        // content: {
        //   posts: userData.posts,
        //   totalPosts: userData.posts.length,
        // },
        accounts: userData.accounts,
        gdprHistory: userData.gdprRequests,
      },
    };

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    console.error("Data export error:", error);
    return {
      errors: { general: ["Erreur lors de l'export"] },
    };
  }
}

export async function deleteUserDataAction() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { errors: { general: ["Non authentifié"] } };
  }

  try {
    // Créer une demande RGPD avant suppression
    await prisma.gDPRRequest.create({
      data: {
        type: "DATA_DELETE",
        email: session.user.email,
        userId: session.user.id,
        message: "Demande de suppression automatique",
        status: "COMPLETED",
        processedDate: new Date(),
        response: "Compte supprimé avec succès",
      },
    });

    // Supprimer toutes les données utilisateur
    // L'ordre est important à cause des contraintes de clés étrangères
    await prisma.userConsent.deleteMany({
      where: { userId: session.user.id },
    });

    // await prisma.post.deleteMany({
    //   where: { authorId: session.user.id },
    // });

    await prisma.session.deleteMany({
      where: { userId: session.user.id },
    });

    await prisma.account.deleteMany({
      where: { userId: session.user.id },
    });

    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Data deletion error:", error);
    return {
      errors: { general: ["Erreur lors de la suppression"] },
    };
  }
}

export async function getConsentAction() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { errors: { general: ["Non authentifié"] } };
  }

  try {
    const consent = await prisma.userConsent.findUnique({
      where: { userId: session.user.id },
    });

    return {
      success: true,
      consent: consent || {
        cookies: false,
        analytics: false,
        marketing: false,
      },
    };
  } catch (error) {
    console.error("Get consent error:", error);
    return {
      errors: { general: ["Erreur lors de la récupération"] },
    };
  }
}

// Ajoutez cette action pour le téléchargement direct
export async function downloadUserDataAction() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  try {
    const result = await exportUserDataAction();

    if (result.success && result.data) {
      // Créer une réponse avec le fichier JSON
      const dataStr = JSON.stringify(result.data, null, 2);

      return new Response(dataStr, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="mes-donnees-${
            new Date().toISOString().split("T")[0]
          }.json"`,
        },
      });
    } else {
      throw new Error("Export failed");
    }
  } catch (error) {
    console.error("Download error:", error);
    redirect("/privacy?error=export-failed");
  }
}
