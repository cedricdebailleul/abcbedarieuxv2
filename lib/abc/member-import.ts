const VALID_TYPES = new Set(["ACTIF", "ARTISAN", "AUTO_ENTREPRENEUR", "PARTENAIRE", "BIENFAITEUR"]);
const VALID_ROLES = new Set(["MEMBRE", "SECRETAIRE", "TRESORIER", "PRESIDENT", "VICE_PRESIDENT"]);
const VALID_STATUTS = new Set(["ACTIVE", "INACTIVE", "SUSPENDED", "EXPIRED"]);

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

    if (!email || !email.includes("@")) {
      return { lineNumber, action: "skip" as const, email, parseError: "Email invalide ou manquant" };
    }

    if (!["create", "update", "skip"].includes(action)) {
      return {
        lineNumber,
        action: "skip" as const,
        email,
        parseError: `Action invalide: "${action}" (attendu: create, update, skip)`,
      };
    }

    const type = String(row.type ?? "").trim().toUpperCase() || undefined;
    const role = String(row.role ?? "").trim().toUpperCase() || undefined;
    const statut = String(row.statut ?? "").trim().toUpperCase() || undefined;

    if (type && !VALID_TYPES.has(type)) {
      return { lineNumber, action: "skip" as const, email, parseError: `Type invalide: "${type}" (valeurs: ${[...VALID_TYPES].join(", ")})` };
    }
    if (role && !VALID_ROLES.has(role)) {
      return { lineNumber, action: "skip" as const, email, parseError: `Rôle invalide: "${role}" (valeurs: ${[...VALID_ROLES].join(", ")})` };
    }
    if (statut && !VALID_STATUTS.has(statut)) {
      return { lineNumber, action: "skip" as const, email, parseError: `Statut invalide: "${statut}" (valeurs: ${[...VALID_STATUTS].join(", ")})` };
    }

    return {
      lineNumber,
      action: action as "create" | "update" | "skip",
      email,
      numero: String(row.numero ?? "").trim() || undefined,
      type,
      role,
      statut,
      dateAdhesion: String(row.dateAdhesion ?? "").trim() || undefined,
      dateExpiration: String(row.dateExpiration ?? "").trim() || undefined,
    };
  });
}
