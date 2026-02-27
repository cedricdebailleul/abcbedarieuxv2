import { siteConfig } from "@/lib/site.config";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.baseUrl}/#organization`,
    name: siteConfig.name,
    alternateName: "Association Bédaricienne des Commerçants",
    url: siteConfig.baseUrl,
    logo: `${siteConfig.baseUrl}/images/logo_abc.png`,
    image: `${siteConfig.baseUrl}/images/logo_abc.png`,
    description: siteConfig.defaultDescription,
    address: {
      "@type": "PostalAddress",
      streetAddress: "1 rue de la République",
      addressLocality: "Bédarieux",
      postalCode: "34600",
      addressCountry: "FR",
      addressRegion: "Occitanie",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.6167,
      longitude: 3.1583,
    },
    telephone: siteConfig.telephone,
    email: siteConfig.email,
    sameAs: [
      "https://www.facebook.com/abcbedarieux",
      "https://www.instagram.com/abcbedarieux",
    ],
    areaServed: {
      "@type": "City",
      name: "Bédarieux",
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: "Hérault, Occitanie, France",
      },
    },
    foundingDate: "2020",
    slogan: "Soutenir et dynamiser le commerce local à Bédarieux",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.telephone,
      email: siteConfig.email,
      contactType: "customer service",
      availableLanguage: "French",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}
