interface PlaceSchemaProps {
  place: {
    name: string;
    description?: string | null;
    summary?: string | null;
    street: string;
    streetNumber?: string | null;
    city: string;
    postalCode: string;
    type: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    coverImage?: string | null;
    logo?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    openingHours?: Array<{
      dayOfWeek: string;
      isClosed: boolean;
      openTime: string | null;
      closeTime: string | null;
    }>;
    categories?: Array<{
      category: {
        name: string;
      };
    }>;
  };
}

export function PlaceSchema({ place }: PlaceSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  
  // Construire l'adresse
  const address = {
    "@type": "PostalAddress",
    streetAddress: `${place.streetNumber || ''} ${place.street}`.trim(),
    addressLocality: place.city,
    postalCode: place.postalCode,
    addressCountry: "FR"
  };

  // Mapper le type de place vers Schema.org
  const getSchemaType = (type: string) => {
    const typeMapping: Record<string, string> = {
      RESTAURANT: "Restaurant",
      COMMERCE: "Store",
      SERVICE: "LocalBusiness",
      ARTISAN: "LocalBusiness",
      ADMINISTRATION: "GovernmentOffice",
      MUSEUM: "Museum",
      TOURISM: "TouristAttraction",
      PARK: "Park",
      LEISURE: "EntertainmentBusiness",
      ASSOCIATION: "Organization",
      HEALTH: "MedicalBusiness",
      EDUCATION: "EducationalOrganization",
      TRANSPORT: "LocalBusiness",
      ACCOMMODATION: "LodgingBusiness",
      OTHER: "LocalBusiness"
    };
    return typeMapping[type] || "LocalBusiness";
  };

  // Construire les horaires d'ouverture
  const openingHours = place.openingHours?.map(hours => {
    if (hours.isClosed || !hours.openTime || !hours.closeTime) return null;
    
    const dayMapping: Record<string, string> = {
      MONDAY: "Mo",
      TUESDAY: "Tu", 
      WEDNESDAY: "We",
      THURSDAY: "Th",
      FRIDAY: "Fr",
      SATURDAY: "Sa",
      SUNDAY: "Su"
    };
    
    const day = dayMapping[hours.dayOfWeek];
    return day ? `${day} ${hours.openTime}-${hours.closeTime}` : null;
  }).filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": getSchemaType(place.type),
    name: place.name,
    description: place.description || place.summary || `${place.name} - ${place.city}`,
    address,
    ...(place.phone && { telephone: place.phone }),
    ...(place.email && { email: place.email }),
    ...(place.website && { url: place.website }),
    ...(place.latitude && place.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: place.latitude,
        longitude: place.longitude
      }
    }),
    ...(place.coverImage && { 
      image: place.coverImage.startsWith('http') ? place.coverImage : `${baseUrl}${place.coverImage}`
    }),
    ...(place.logo && { 
      logo: place.logo.startsWith('http') ? place.logo : `${baseUrl}${place.logo}`
    }),
    ...(openingHours && openingHours.length > 0 && { openingHours }),
    inLanguage: "fr",
    ...(place.categories && place.categories.length > 0 && {
      category: place.categories.map(pc => pc.category.name)
    }),
    // Données de contact
    contactPoint: {
      "@type": "ContactPoint",
      ...(place.phone && { telephone: place.phone }),
      ...(place.email && { email: place.email }),
      contactType: "customer service",
      availableLanguage: "French"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}