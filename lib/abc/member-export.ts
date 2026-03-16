import * as XLSX from "xlsx";

export const EXPORT_HEADERS = [
  "action", "numero", "nom", "prenom", "email", "telephone",
  "type", "role", "statut", "dateAdhesion", "dateExpiration",
  "cotisationAnnee", "cotisationMontant", "cotisationStatut",
  "placeNom", "placeAdresse",
];

function getNameParts(user: { name: string; profile?: { firstname?: string | null; lastname?: string | null } | null }) {
  if (user.profile?.firstname || user.profile?.lastname) {
    return { prenom: user.profile.firstname ?? "", nom: user.profile.lastname ?? "" };
  }
  const parts = user.name.split(" ");
  return { prenom: parts[0] ?? "", nom: parts.slice(1).join(" ") };
}

export function buildMemberRows(members: any[]) {
  return members.map((m) => {
    const { prenom, nom } = getNameParts(m.user);

    // Latest payment: sort by year desc, createdAt desc
    const latestPayment = [...(m.payments ?? [])].sort((a, b) =>
      b.year !== a.year ? b.year - a.year : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    const firstPlace = m.places?.[0]?.place;
    const streetPart = [firstPlace?.streetNumber, firstPlace?.street].filter(Boolean).join(" ");
    const placeAdresse = firstPlace
      ? [streetPart, `${firstPlace.postalCode} ${firstPlace.city}`].filter(Boolean).join(", ")
      : "";

    return {
      action: "update",
      numero: m.memberNumber ?? "",
      nom,
      prenom,
      email: m.user.email,
      telephone: m.user.profile?.phone ?? "",
      type: m.type,
      role: m.role,
      statut: m.status,
      dateAdhesion: m.membershipDate ? new Date(m.membershipDate).toISOString().split("T")[0] : "",
      dateExpiration: m.expiresAt ? new Date(m.expiresAt).toISOString().split("T")[0] : "",
      cotisationAnnee: latestPayment?.year ?? "",
      cotisationMontant: latestPayment?.amount ?? "",
      cotisationStatut: latestPayment?.status ?? "",
      placeNom: firstPlace?.name ?? "",
      placeAdresse,
    };
  });
}

export function membersToWorkbook(rows: ReturnType<typeof buildMemberRows>) {
  const wsData = [EXPORT_HEADERS, ...rows.map((r) => EXPORT_HEADERS.map((h) => (r as any)[h] ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Bold headers (row 1)
  for (let c = 0; c < EXPORT_HEADERS.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cellRef]) ws[cellRef].s = { font: { bold: true } };
  }

  // Auto column widths
  ws["!cols"] = EXPORT_HEADERS.map((h) => ({
    wch: Math.max(h.length, ...rows.map((r) => String((r as any)[h] ?? "").length)) + 2,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Membres");
  return wb;
}

export function membersToCSV(rows: ReturnType<typeof buildMemberRows>): Buffer {
  const lines = [
    EXPORT_HEADERS.join(";"),
    ...rows.map((r) =>
      EXPORT_HEADERS.map((h) => {
        const val = String((r as any)[h] ?? "");
        return val.includes(";") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(";")
    ),
  ];
  // UTF-8 BOM for Excel Windows compatibility
  return Buffer.concat([Buffer.from("\uFEFF", "utf8"), Buffer.from(lines.join("\n"), "utf8")]);
}
