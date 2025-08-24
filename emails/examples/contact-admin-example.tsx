import ContactAdminEmail from "../contact-admin-email";

export default function ContactAdminExample() {
  return ContactAdminEmail({
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@example.com",
    phone: "06 12 34 56 78",
    company: "Boulangerie Dupont",
    subject: "Demande d'adhésion à l'association",
    message: "Bonjour,\n\nJe souhaiterais adhérer à l'Association Bédaricienne des Commerçants pour ma boulangerie située rue de la République.\n\nPourriez-vous m'envoyer les documents nécessaires et me dire quelles sont les démarches à suivre ?\n\nMerci pour votre retour.\n\nCordialement,\nMarie Dupont",
    receivedAt: "vendredi 23 août 2024 à 14:32",
  });
}