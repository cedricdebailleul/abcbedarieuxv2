interface EventSchemaProps {
  event: {
    title: string;
    description?: string | null;
    summary?: string | null;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    timezone: string;
    locationName?: string | null;
    locationAddress?: string | null;
    locationCity?: string | null;
    locationLatitude?: number | null;
    locationLongitude?: number | null;
    coverImage?: string | null;
    isFree: boolean;
    price?: number | null;
    currency?: string | null;
    ticketUrl?: string | null;
    website?: string | null;
    organizer?: {
      name: string;
      email?: string | null;
    } | null;
    place?: {
      name: string;
      street: string;
      city: string;
      postalCode: string;
      latitude?: number | null;
      longitude?: number | null;
    } | null;
  };
}

export function EventSchema({ event }: EventSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  
  // Construire l'adresse du lieu
  const location = event.place ? {
    "@type": "Place",
    name: event.place.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: event.place.street,
      addressLocality: event.place.city,
      postalCode: event.place.postalCode,
      addressCountry: "FR"
    },
    ...(event.place.latitude && event.place.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: event.place.latitude,
        longitude: event.place.longitude
      }
    })
  } : event.locationName ? {
    "@type": "Place",
    name: event.locationName,
    address: {
      "@type": "PostalAddress",
      addressLocality: event.locationCity || 'Bédarieux',
      addressCountry: "FR"
    },
    ...(event.locationLatitude && event.locationLongitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: event.locationLatitude,
        longitude: event.locationLongitude
      }
    })
  } : {
    "@type": "Place",
    name: event.locationCity || 'Bédarieux',
    address: {
      "@type": "PostalAddress",
      addressLocality: event.locationCity || 'Bédarieux',
      addressCountry: "FR"
    }
  };

  // Construire l'objet organisation
  const organizer = event.organizer ? {
    "@type": "Organization",
    name: event.organizer.name,
    ...(event.organizer.email && { email: event.organizer.email })
  } : {
    "@type": "Organization",
    name: "ABC Bédarieux",
    url: baseUrl
  };

  // Prix et offres
  const offers = event.isFree ? {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    validFrom: new Date().toISOString()
  } : event.price ? {
    "@type": "Offer",
    price: event.price.toString(),
    priceCurrency: event.currency || "EUR",
    availability: "https://schema.org/InStock",
    validFrom: new Date().toISOString(),
    ...(event.ticketUrl && { url: event.ticketUrl })
  } : undefined;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || event.summary || `Événement : ${event.title}`,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location,
    organizer,
    ...(offers && { offers }),
    ...(event.coverImage && { 
      image: event.coverImage.startsWith('http') ? event.coverImage : `${baseUrl}${event.coverImage}`
    }),
    ...(event.website && { url: event.website }),
    inLanguage: "fr",
    // Métadonnées supplémentaires pour Facebook
    publisher: {
      "@type": "Organization",
      name: "ABC Bédarieux",
      url: baseUrl
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}