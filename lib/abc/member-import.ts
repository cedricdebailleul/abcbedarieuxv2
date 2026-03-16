export interface ParsedImportRow {
  lineNumber: number;
  action: "create" | "update" | "skip";
  email: string;
  numero?: string;
  type?: string;
  role?: string;
  statut?: string;
  dateAdhesion?: string;
  dateExpiration?: string;
  parseError?: string;
}

export function validateImportStructure(
  rows: Record<string, unknown>[]
): { ok: true } | { ok: false; error: string } {
  if (rows.length === 0) return { ok: true };
  const first = rows[0];
  if (!("action" in first)) return { ok: false, error: "Colonne 'action' manquante" };
  if (!("email" in first)) return { ok: false, error: "Colonne 'email' manquante" };
  return { ok: true };
}

export function parseImportRows(
  rawRows: Record<string, unknown>[]
): ParsedImportRow[] {
  return rawRows.map((row, i) => {
    const lineNumber = i + 2; // 1-indexed, row 1 = headers
    const action = String(row.action ?? "").trim().toLowerCase();
    const email = String(row.email ?? "").trim().toLowerCase();

    if (!["create", "update", "skip"].includes(action)) {
      return {
        lineNumber,
        action: "skip" as const,
        email,
        parseError: `Action invalide: "${action}" (attendu: create, update, skip)`,
      };
    }

    return {
      lineNumber,
      action: action as "create" | "update" | "skip",
      email,
      numero: String(row.numero ?? "").trim() || undefined,
      type: String(row.type ?? "").trim() || undefined,
      role: String(row.role ?? "").trim() || undefined,
      statut: String(row.statut ?? "").trim() || undefined,
      dateAdhesion: String(row.dateAdhesion ?? "").trim() || undefined,
      dateExpiration: String(row.dateExpiration ?? "").trim() || undefined,
    };
  });
}
