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

interface ContactAdminEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  receivedAt: string;
}

export const ContactAdminEmail = ({
  firstName,
  lastName,
  email,
  phone,
  company,
  subject,
  message,
  receivedAt,
}: ContactAdminEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Nouveau message de contact de {firstName} {lastName}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Heading style={headerTitle}>ABC Bédarieux</Heading>
          <Text style={headerSubtitle}>Nouveau message de contact</Text>
        </Section>

        {/* Alert Badge */}
        <Section style={alertSection}>
          <div style={alertBadge}>📧 Nouveau message</div>
        </Section>

        {/* Contact Information */}
        <Section style={section}>
          <Heading style={sectionTitle}>Informations du contact</Heading>

          <Row style={infoRow}>
            <Column style={infoLabel}>
              <Text style={labelText}>👤 Nom complet :</Text>
            </Column>
            <Column>
              <Text style={valueText}>
                {firstName} {lastName}
              </Text>
            </Column>
          </Row>

          <Row style={infoRow}>
            <Column style={infoLabel}>
              <Text style={labelText}>📧 Email :</Text>
            </Column>
            <Column>
              <Link href={`mailto:${email}`} style={linkText}>
                {email}
              </Link>
            </Column>
          </Row>

          {phone && (
            <Row style={infoRow}>
              <Column style={infoLabel}>
                <Text style={labelText}>📞 Téléphone :</Text>
              </Column>
              <Column>
                <Link href={`tel:${phone}`} style={linkText}>
                  {phone}
                </Link>
              </Column>
            </Row>
          )}

          {company && (
            <Row style={infoRow}>
              <Column style={infoLabel}>
                <Text style={labelText}>🏢 Entreprise :</Text>
              </Column>
              <Column>
                <Text style={valueText}>{company}</Text>
              </Column>
            </Row>
          )}

          <Row style={infoRow}>
            <Column style={infoLabel}>
              <Text style={labelText}>📝 Sujet :</Text>
            </Column>
            <Column>
              <Text style={valueText}>{subject}</Text>
            </Column>
          </Row>
        </Section>

        {/* Message Content */}
        <Section style={section}>
          <Heading style={sectionTitle}>Message</Heading>
          <div style={messageBox}>
            <Text style={messageText}>
              {message.split("\n").map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < message.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </Text>
          </div>
        </Section>

        {/* Quick Actions */}
        <Section style={section}>
          <Heading style={sectionTitle}>Actions rapides</Heading>
          <div style={buttonsContainer}>
            <Link
              href={`mailto:${email}?subject=Re: ${subject}`}
              style={primaryButton}
            >
              🔄 Répondre par email
            </Link>
            {phone && (
              <Link href={`tel:${phone}`} style={secondaryButton}>
                📞 Appeler
              </Link>
            )}
          </div>
        </Section>

        <Hr style={hr} />

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>📅 Message reçu le {receivedAt}</Text>
          <Text style={footerText}>
            Envoyé depuis le formulaire de contact ABC Bédarieux
          </Text>
          <Text style={footerCopyright}>
            Association Bédaricienne des Commerçants
            <br />
            &copy; {new Date().getFullYear()} ABC Bédarieux. Tous droits
            réservés.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ContactAdminEmail;

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
};

const header = {
  backgroundColor: "#6366f1",
  borderRadius: "8px 8px 0 0",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const headerSubtitle = {
  color: "#e0e7ff",
  fontSize: "16px",
  margin: "0",
};

const alertSection = {
  padding: "24px 24px 0 24px",
  textAlign: "center" as const,
};

const alertBadge = {
  backgroundColor: "#059669",
  color: "#ffffff",
  padding: "8px 16px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: "bold",
  display: "inline-block",
};

const section = {
  padding: "24px",
};

const sectionTitle = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const infoRow = {
  marginBottom: "12px",
};

const infoLabel = {
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

const linkText = {
  color: "#6366f1",
  fontSize: "14px",
  textDecoration: "none",
};

const messageBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
};

const messageText = {
  color: "#1f2937",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const buttonsContainer = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const primaryButton = {
  backgroundColor: "#6366f1",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  display: "inline-block",
};

const secondaryButton = {
  backgroundColor: "#f3f4f6",
  color: "#1f2937",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  display: "inline-block",
  border: "1px solid #d1d5db",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const footer = {
  padding: "24px",
  textAlign: "center" as const,
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
};
