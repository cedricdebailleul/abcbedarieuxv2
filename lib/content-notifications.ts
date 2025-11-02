import { env } from "./env";
import { sendEmail } from "./mailer";

// Type pour le contenu générique
type ContentType = "event" | "post" | "place" | "product";

// Fonction pour obtenir tous les admins
async function getAdminEmails(): Promise<string[]> {
  try {
    const { prisma } = await import("./prisma");
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { email: true },
    });
    return admins.map((admin) => admin.email);
  } catch (error) {
    console.error("Erreur lors de la récupération des emails admin:", error);
    return [];
  }
}

// Fonction utilitaire pour obtenir le label en français du type de contenu
function getContentTypeLabel(contentType: ContentType): string {
  const labels: Record<ContentType, string> = {
    event: "événement",
    post: "article",
    place: "établissement",
    product: "produit",
  };
  return labels[contentType];
}

// Fonction utilitaire pour obtenir l'URL d'administration
function getAdminUrl(contentType: ContentType): string {
  const paths: Record<ContentType, string> = {
    event: "/dashboard/admin/events",
    post: "/dashboard/admin/posts",
    place: "/dashboard/admin/places",
    product: "/dashboard/admin/products",
  };
  return `${env.NEXT_PUBLIC_URL}${paths[contentType]}`;
}

// Template générique pour nouvelle création de contenu
export const contentEmailTemplates = {
  adminNewContent: (
    contentType: ContentType,
    contentTitle: string,
    userName: string,
    userEmail: string
  ) => {
    const typeLabel = getContentTypeLabel(contentType);
    const typeLabelCapitalized = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);

    return {
      subject: `Nouveau ${typeLabel} en attente : ${contentTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">${typeLabelCapitalized} en attente de validation</h2>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">${typeLabelCapitalized} : ${contentTitle}</h3>
            <p style="margin: 5px 0;"><strong>Créé par :</strong> ${userName} (${userEmail})</p>
          </div>

          <p>Un nouveau ${typeLabel} a été ajouté et nécessite votre validation.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${getAdminUrl(contentType)}"
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir dans l'administration
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Vous recevez cet email car vous êtes administrateur de ABC Bédarieux.
          </p>
        </div>
      `,
    };
  },

  // Notification pour nouvel utilisateur
  adminNewUser: (userName: string, userEmail: string) => ({
    subject: `Nouveau compte utilisateur : ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Nouveau compte utilisateur</h2>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #374151;">Utilisateur : ${userName}</h3>
          <p style="margin: 5px 0;"><strong>Email :</strong> ${userEmail}</p>
        </div>

        <p>Un nouvel utilisateur s'est inscrit sur la plateforme.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.NEXT_PUBLIC_URL}/dashboard/admin/users"
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voir dans l'administration
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Vous recevez cet email car vous êtes administrateur de ABC Bédarieux.
        </p>
      </div>
    `,
  }),
};

// Fonction générique pour notifier les admins d'un nouveau contenu
export async function notifyAdminsNewContent(
  contentType: ContentType,
  contentTitle: string,
  userName: string,
  userEmail: string
) {
  try {
    const adminEmails = await getAdminEmails();
    if (adminEmails.length === 0) {
      console.warn(`No admin emails found for ${contentType} notification`);
      return;
    }

    const template = contentEmailTemplates.adminNewContent(
      contentType,
      contentTitle,
      userName,
      userEmail
    );

    for (const email of adminEmails) {
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log(`Admin notification sent for new ${contentType}: ${contentTitle}`);
  } catch (error) {
    console.error(
      `Erreur lors de l'envoi des notifications admin pour ${contentType}:`,
      error
    );
  }
}

// Fonctions spécifiques pour chaque type de contenu (pour compatibilité)
export async function notifyAdminsNewEvent(
  eventTitle: string,
  userName: string,
  userEmail: string
) {
  return notifyAdminsNewContent("event", eventTitle, userName, userEmail);
}

export async function notifyAdminsNewPost(
  postTitle: string,
  userName: string,
  userEmail: string
) {
  return notifyAdminsNewContent("post", postTitle, userName, userEmail);
}

export async function notifyAdminsNewProduct(
  productName: string,
  userName: string,
  userEmail: string
) {
  return notifyAdminsNewContent("product", productName, userName, userEmail);
}

// Notification pour nouvel utilisateur
export async function notifyAdminsNewUser(userName: string, userEmail: string) {
  try {
    const adminEmails = await getAdminEmails();
    if (adminEmails.length === 0) {
      console.warn("No admin emails found for new user notification");
      return;
    }

    const template = contentEmailTemplates.adminNewUser(userName, userEmail);

    for (const email of adminEmails) {
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log(`Admin notification sent for new user: ${userName}`);
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi des notifications admin pour nouvel utilisateur:",
      error
    );
  }
}
