import { env } from "./env";
import { sendEmail } from "./mailer";

// Templates d'emails pour les places
export const emailTemplates = {
  // Notification admin - nouvelle place créée
  adminNewPlace: (placeName: string, userName: string, userEmail: string, _placeId: string) => ({
    subject: `Nouvelle place en attente : ${placeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Nouvelle place en attente de validation</h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #374151;">Place : ${placeName}</h3>
          <p style="margin: 5px 0;"><strong>Créée par :</strong> ${userName} (${userEmail})</p>
        </div>
        
        <p>Une nouvelle place a été ajoutée et nécessite votre validation.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.NEXT_PUBLIC_URL}/admin/places" 
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

  // Notification admin - place revendiquée
  adminPlaceClaimed: (
    placeName: string,
    userName: string,
    userEmail: string,
    message: string,
    _claimId: string
  ) => ({
    subject: `Revendication de place : ${placeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Nouvelle revendication de place</h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #374151;">Place : ${placeName}</h3>
          <p style="margin: 5px 0;"><strong>Demandeur :</strong> ${userName} (${userEmail})</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">Message de revendication :</h4>
          <p style="margin: 0; color: #92400e;">${message}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.NEXT_PUBLIC_URL}/admin/claims" 
             style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Traiter la revendication
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Vous recevez cet email car vous êtes administrateur de ABC Bédarieux.
        </p>
      </div>
    `,
  }),

  // Notification utilisateur - place approuvée
  userPlaceApproved: (placeName: string, adminMessage?: string) => ({
    subject: `Votre place "${placeName}" a été approuvée !`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🎉 Votre place a été approuvée !</h2>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #065f46;">Place : ${placeName}</h3>
          <p style="margin: 0; color: #047857;">Votre place est maintenant visible publiquement sur notre répertoire !</p>
        </div>
        
        ${
          adminMessage
            ? `
          <div style="background-color: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0277bd;">Message de l'administrateur :</h4>
            <p style="margin: 0; color: #01579b;">${adminMessage}</p>
          </div>
        `
            : ""
        }
        
        <p>Vous pouvez maintenant :</p>
        <ul style="color: #374151;">
          <li>Modifier les informations de votre place</li>
          <li>Répondre aux avis clients</li>
          <li>Suivre les statistiques de consultation</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.NEXT_PUBLIC_URL}/places" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            Gérer mes places
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Merci de faire confiance à ABC Bédarieux pour promouvoir votre établissement !
        </p>
      </div>
    `,
  }),

  // Notification utilisateur - place rejetée
  userPlaceRejected: (placeName: string, adminMessage?: string) => ({
    subject: `Votre place "${placeName}" nécessite des modifications`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Place nécessitant des modifications</h2>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #7f1d1d;">Place : ${placeName}</h3>
          <p style="margin: 0; color: #991b1b;">Votre place nécessite quelques ajustements avant d'être publiée.</p>
        </div>
        
        ${
          adminMessage
            ? `
          <div style="background-color: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0277bd;">Message de l'administrateur :</h4>
            <p style="margin: 0; color: #01579b;">${adminMessage}</p>
          </div>
        `
            : ""
        }
        
        <p>Que faire maintenant :</p>
        <ul style="color: #374151;">
          <li>Consultez les commentaires de l'administrateur ci-dessus</li>
          <li>Modifiez votre place pour corriger les points mentionnés</li>
          <li>Votre place sera automatiquement re-soumise pour validation</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.NEXT_PUBLIC_URL}/places" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Modifier ma place
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Notre équipe est là pour vous aider à créer une fiche parfaite pour votre établissement.
        </p>
      </div>
    `,
  }),

  // Notification utilisateur - revendication approuvée
  userClaimApproved: (placeName: string, adminMessage?: string) => ({
    subject: `Revendication approuvée pour "${placeName}" !`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🎉 Revendication approuvée !</h2>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #065f46;">Place : ${placeName}</h3>
          <p style="margin: 0; color: #047857;">Félicitations ! Vous êtes maintenant propriétaire de cette place.</p>
        </div>
        
        ${
          adminMessage
            ? `
          <div style="background-color: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0277bd;">Message de l'administrateur :</h4>
            <p style="margin: 0; color: #01579b;">${adminMessage}</p>
          </div>
        `
            : ""
        }
        
        <p>En tant que propriétaire, vous pouvez maintenant :</p>
        <ul style="color: #374151;">
          <li>Modifier toutes les informations de votre place</li>
          <li>Ajouter des photos et descriptions</li>
          <li>Répondre aux avis clients</li>
          <li>Suivre les statistiques de consultation</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.NEXT_PUBLIC_URL}/places" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Gérer ma place
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Merci de faire confiance à ABC Bédarieux pour promouvoir votre établissement !
        </p>
      </div>
    `,
  }),

  // Notification utilisateur - revendication rejetée
  userClaimRejected: (placeName: string, adminMessage?: string) => ({
    subject: `Revendication non acceptée pour "${placeName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Revendication non acceptée</h2>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #7f1d1d;">Place : ${placeName}</h3>
          <p style="margin: 0; color: #991b1b;">Votre demande de revendication n'a pas pu être acceptée.</p>
        </div>
        
        ${
          adminMessage
            ? `
          <div style="background-color: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0277bd;">Raison du refus :</h4>
            <p style="margin: 0; color: #01579b;">${adminMessage}</p>
          </div>
        `
            : ""
        }
        
        <p>Si vous pensez qu'il s'agit d'une erreur :</p>
        <ul style="color: #374151;">
          <li>Vérifiez que vous avez fourni toutes les preuves nécessaires</li>
          <li>Vous pouvez faire une nouvelle demande avec plus d'informations</li>
          <li>Contactez notre équipe si vous avez des questions</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.NEXT_PUBLIC_URL}/contact" 
             style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Nous contacter
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Notre équipe examine chaque demande avec attention pour maintenir la qualité du répertoire.
        </p>
      </div>
    `,
  }),
};

// Fonction pour obtenir tous les admins
async function getAdminEmails(): Promise<string[]> {
  try {
    // Import dynamique pour éviter les problèmes de circular dependency
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

// Notifications pour les admins
export async function notifyAdminsNewPlace(
  placeName: string,
  userName: string,
  userEmail: string,
  placeId: string
) {
  try {
    const adminEmails = await getAdminEmails();
    const template = emailTemplates.adminNewPlace(placeName, userName, userEmail, placeId);

    for (const email of adminEmails) {
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log(
      `Notification envoyée à ${adminEmails.length} admin(s) pour la nouvelle place: ${placeName}`
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi des notifications admin:", error);
  }
}

export async function notifyAdminsPlaceClaimed(
  placeName: string,
  userName: string,
  userEmail: string,
  message: string,
  claimId: string
) {
  try {
    const adminEmails = await getAdminEmails();
    const template = emailTemplates.adminPlaceClaimed(
      placeName,
      userName,
      userEmail,
      message,
      claimId
    );

    for (const email of adminEmails) {
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    }

    console.log(
      `Notification envoyée à ${adminEmails.length} admin(s) pour la revendication de: ${placeName}`
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi des notifications admin:", error);
  }
}

// Notifications pour les utilisateurs
export async function notifyUserPlaceApproved(
  userEmail: string,
  placeName: string,
  adminMessage?: string
) {
  try {
    const template = emailTemplates.userPlaceApproved(placeName, adminMessage);

    await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });

    console.log(`Notification d'approbation envoyée à ${userEmail} pour: ${placeName}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification d'approbation:", error);
  }
}

export async function notifyUserPlaceRejected(
  userEmail: string,
  placeName: string,
  adminMessage?: string
) {
  try {
    const template = emailTemplates.userPlaceRejected(placeName, adminMessage);

    await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });

    console.log(`Notification de rejet envoyée à ${userEmail} pour: ${placeName}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification de rejet:", error);
  }
}

export async function notifyUserClaimApproved(
  userEmail: string,
  placeName: string,
  adminMessage?: string
) {
  try {
    const template = emailTemplates.userClaimApproved(placeName, adminMessage);

    await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });

    console.log(
      `Notification de revendication approuvée envoyée à ${userEmail} pour: ${placeName}`
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification de revendication approuvée:", error);
  }
}

export async function notifyUserClaimRejected(
  userEmail: string,
  placeName: string,
  adminMessage?: string
) {
  try {
    const template = emailTemplates.userClaimRejected(placeName, adminMessage);

    await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });

    console.log(`Notification de revendication rejetée envoyée à ${userEmail} pour: ${placeName}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification de revendication rejetée:", error);
  }
}
