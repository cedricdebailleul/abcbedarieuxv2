import ContactConfirmationEmail from "../contact-confirmation-email";

export default function ContactConfirmationExample() {
  return ContactConfirmationEmail({
    firstName: "Marie",
    lastName: "Dupont",
    subject: "Demande d'adhésion à l'association",
    message: "Bonjour,\n\nJe souhaiterais adhérer à l'Association Bédaricienne des Commerçants pour ma boulangerie située rue de la République.\n\nPourriez-vous m'envoyer les documents nécessaires et me dire quelles sont les démarches à suivre ?\n\nMerci pour votre retour.\n\nCordialement,\nMarie Dupont",
    submittedAt: "vendredi 23 août 2024 à 14:32",
  });
}