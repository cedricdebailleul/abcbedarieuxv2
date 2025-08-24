// app/api/emails/preview/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // pas de pré-rendue/ISR
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // En prod, on renvoie 404 (pas d'exception au build)
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const template = searchParams.get("template");

  // ⬇️ imports dev-only
  const React = await import("react");
  const { render } = await import("@react-email/render");

  const sampleData = {
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@example.com",
    phone: "06 12 34 56 78",
    company: "Boulangerie Dupont",
    subject: "Demande d'adhésion à l'association",
    message:
      "Bonjour,\n\nJe souhaiterais adhérer à l'Association Bédaricienne des Commerçants pour ma boulangerie située rue de la République.\n\nPourriez-vous m'envoyer les documents nécessaires et me dire quelles sont les démarches à suivre ?\n\nMerci pour votre retour.\n\nCordialement,\nMarie Dupont",
    receivedAt: "vendredi 23 août 2024 à 14:32",
    submittedAt: "vendredi 23 août 2024 à 14:32",
  };

  try {
    let html: string;

    switch (template) {
      case "contact-admin": {
        const { default: ContactAdminEmail } = await import(
          "@/emails/contact-admin-email"
        );
        html = await render(React.createElement(ContactAdminEmail, sampleData));
        break;
      }
      case "contact-confirmation": {
        const { default: ContactConfirmationEmail } = await import(
          "@/emails/contact-confirmation-email"
        );
        html = await render(
          React.createElement(ContactConfirmationEmail, sampleData)
        );
        break;
      }
      default:
        return NextResponse.json(
          {
            error: "Template non trouvé",
            available: ["contact-admin", "contact-confirmation"],
          },
          { status: 400 }
        );
    }

    return new NextResponse(html, {
      headers: { "content-type": "text/html" },
    });
  } catch (error) {
    console.error("Erreur lors du rendu de l'email:", error);
    return NextResponse.json(
      { error: "Erreur lors du rendu de l'email" },
      { status: 500 }
    );
  }
}
