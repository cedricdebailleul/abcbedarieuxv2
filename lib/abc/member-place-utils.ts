export const ROLE_LABELS: Record<string, string> = {
  GERANT: "Gérant",
  ASSOCIE: "Associé",
  SALARIE: "Salarié",
  AUTRE: "Autre",
};

interface PlaceLink {
  id: string;
  placeId: string;
  role: string;
  place: {
    name: string;
    slug: string;
    streetNumber: string | null;
    street: string | null;
    postalCode: string;
    city: string;
  };
  createdAt: Date;
}

export function buildMemberPlaceRows(places: PlaceLink[]) {
  return places.map((link) => ({
    id: link.id,
    placeId: link.placeId,
    role: link.role,
    roleLabel: ROLE_LABELS[link.role] ?? link.role,
    placeNom: link.place.name,
    placeAdresse: [
      link.place.streetNumber,
      link.place.street,
      link.place.postalCode,
      link.place.city,
    ]
      .filter(Boolean)
      .join(" "),
    createdAt: link.createdAt,
  }));
}
