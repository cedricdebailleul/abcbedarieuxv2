import { siteConfig } from "@/lib/site.config";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface ContactConfirmationEmailProps {
  firstName: string;
  lastName: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export const ContactConfirmationEmail = ({
  firstName,
  subject,
  message,
  submittedAt,
}: ContactConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirmation de réception - ABC Bédarieux</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Heading style={headerTitle}>ABC Bédarieux</Heading>
          <Text style={headerSubtitle}>
            Association Bédaricienne des Commerçants
          </Text>
        </Section>

        {/* Success Badge */}
        <Section style={successSection}>
          <div style={successBadge}>✅ Message bien reçu !</div>
        </Section>

        {/* Main Content */}
        <Section style={section}>
          <Heading style={welcomeTitle}>Bonjour {firstName} !</Heading>
          <Text style={mainText}>
            Merci d&apos;avoir pris le temps de nous contacter. Nous avons bien
            reçu votre message concernant :
          </Text>
          <div style={subjectBox}>
            <Text style={subjectText}>&quot;{subject}&quot;</Text>
          </div>
          <Text style={mainText}>
            Notre équipe étudie votre demande et vous répondra dans les plus
            brefs délais, généralement sous 24-48h ouvrées.
          </Text>
        </Section>

        {/* Message Summary */}
        <Section style={section}>
          <Heading style={sectionTitle}>
            📄 Récapitulatif de votre demande
          </Heading>

          <Row style={summaryRow}>
            <Column style={summaryLabel}>
              <Text style={labelText}>Date d&apos;envoi :</Text>
            </Column>
            <Column>
              <Text style={valueText}>{submittedAt}</Text>
            </Column>
          </Row>

          <Row style={summaryRow}>
            <Column style={summaryLabel}>
              <Text style={labelText}>Sujet :</Text>
            </Column>
            <Column>
              <Text style={valueText}>{subject}</Text>
            </Column>
          </Row>

          <div style={messagePreviewBox}>
            <Text style={messagePreviewTitle}>Votre message :</Text>
            <Text style={messagePreviewText}>
              {message.split("\n").map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < message.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </Text>
          </div>
        </Section>

        {/* Contact Information */}
        <Section style={contactSection}>
          <Heading style={sectionTitle}>📞 Nos coordonnées</Heading>
          <div style={contactBox}>
            <Row style={contactRow}>
              <Column style={contactIcon}>
                <Text style={iconText}>📍</Text>
              </Column>
              <Column>
                <Text style={contactText}>
                  <strong>Adresse</strong>
                  <br />
                  {siteConfig.adresse}
                </Text>
              </Column>
            </Row>

            <Row style={contactRow}>
              <Column style={contactIcon}>
                <Text style={iconText}>📧</Text>
              </Column>
              <Column>
                <Text style={contactText}>
                  <strong>Email</strong>
                  <br />
                  <Link href={`mailto:${siteConfig.email}`} style={linkText}>
                    {siteConfig.email}
                  </Link>
                  <strong>Téléphone</strong>
                  <br />
                  <Link href={`tel:${siteConfig.telephone}`} style={linkText}>
                    {siteConfig.telephone}
                  </Link>
                </Text>
              </Column>
            </Row>
          </div>
        </Section>

        {/* CTA Section */}
        <Section style={ctaSection}>
          <Text style={ctaText}>
            En attendant notre réponse, n&apos;hésitez pas à :
          </Text>
          <div style={buttonsContainer}>
            <Link href={siteConfig.baseUrl} style={primaryButton}>
              🌐 Visiter notre site
            </Link>

            <Link href={`mailto:${siteConfig.email}`} style={secondaryButton}>
              📧 Nous écrire directement
            </Link>
          </div>
        </Section>

        <Hr style={hr} />

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Cet email de confirmation a été envoyé automatiquement.
          </Text>
          <Text style={footerText}>
            Si vous n&apos;êtes pas à l&apos;origine de cette demande, vous
            pouvez ignorer ce message.
          </Text>
          <Text style={footerCopyright}>
            © {new Date().getFullYear()} Association Bédaricienne des
            Commerçants
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ContactConfirmationEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  borderRadius: "8px",
};

const header = {
  backgroundColor: "#6366f1",
  borderRadius: "8px 8px 0 0",
  padding: "32px 24px",
  textAlign: "center" as const,
  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const headerSubtitle = {
  color: "#e0e7ff",
  fontSize: "16px",
  margin: "0",
  fontWeight: "500",
};

const successSection = {
  padding: "32px 24px 16px 24px",
  textAlign: "center" as const,
};

const successBadge = {
  backgroundColor: "#059669",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "25px",
  fontSize: "16px",
  fontWeight: "bold",
  display: "inline-block",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
};

const section = {
  padding: "24px",
};

const welcomeTitle = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const sectionTitle = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const mainText = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const subjectBox = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
  textAlign: "center" as const,
};

const subjectText = {
  color: "#1e40af",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
};

const summaryRow = {
  marginBottom: "8px",
};

const summaryLabel = {
  width: "30%",
  verticalAlign: "top",
};

const labelText = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const valueText = {
  color: "#1f2937",
  fontSize: "14px",
  margin: "0",
};

const messagePreviewBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
};

const messagePreviewTitle = {
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const messagePreviewText = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const contactSection = {
  padding: "24px",
  backgroundColor: "#f8fafc",
};

const contactBox = {
  padding: "16px",
};

const contactRow = {
  marginBottom: "16px",
};

const contactIcon = {
  width: "32px",
  verticalAlign: "top",
};

const iconText = {
  fontSize: "20px",
  margin: "0",
};

const contactText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const linkText = {
  color: "#6366f1",
  textDecoration: "none",
};

const ctaSection = {
  padding: "24px",
  textAlign: "center" as const,
};

const ctaText = {
  color: "#4b5563",
  fontSize: "16px",
  margin: "0 0 20px 0",
};

const buttonsContainer = {
  display: "flex",
  gap: "12px",
  justifyContent: "center",
  flexWrap: "wrap" as const,
};

const primaryButton = {
  backgroundColor: "#6366f1",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  display: "inline-block",
  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  transition: "all 0.3s ease",
};

const secondaryButton = {
  backgroundColor: "#ffffff",
  color: "#374151",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  display: "inline-block",
  border: "1px solid #d1d5db",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const footer = {
  padding: "24px",
  textAlign: "center" as const,
  backgroundColor: "#f9fafb",
};

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "4px 0",
};

const footerCopyright = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "16px 0 0 0",
  fontWeight: "500",
};
