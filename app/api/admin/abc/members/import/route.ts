import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateImportStructure, parseImportRows } from "@/lib/abc/member-import";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 5000;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const role = (session?.user as any)?.role;
  if (!session?.user || !["admin", "moderator"].includes(role)) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
  }

  // Parse file
  const buffer = Buffer.from(await file.arrayBuffer());
  let rawRows: Record<string, unknown>[];
  try {
    // Auto-detect CSV separator (`;` or `,`) from first line content
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    const readOptions: Parameters<typeof XLSX.read>[1] = { type: "buffer", codepage: 65001 };
    if (isCsv) {
      const text = buffer.toString("utf8").replace(/^\uFEFF/, ""); // strip BOM
      const firstLine = text.split(/\r?\n/)[0] ?? "";
      readOptions.FS = firstLine.includes(";") ? ";" : ",";
    }
    const wb = XLSX.read(buffer, readOptions);
    const ws = wb.Sheets[wb.SheetNames[0]];

    // Validate required columns from the header row (even if no data rows)
    const headerRow = (XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" })[0] ?? []).map(
      (h) => String(h).toLowerCase().trim()
    );
    if (headerRow.length > 0) {
      if (!headerRow.includes("action")) {
        return NextResponse.json({ error: "Colonne 'action' manquante" }, { status: 400 });
      }
      if (!headerRow.includes("email")) {
        return NextResponse.json({ error: "Colonne 'email' manquante" }, { status: 400 });
      }
    }

    rawRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  } catch {
    return NextResponse.json({ error: "Impossible de lire le fichier" }, { status: 400 });
  }

  if (rawRows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Trop de lignes (max ${MAX_ROWS})` }, { status: 400 });
  }

  // Structural validation (handles edge cases not covered by header check above)
  const structCheck = validateImportStructure(rawRows);
  if (!structCheck.ok) {
    return NextResponse.json({ error: structCheck.error }, { status: 400 });
  }

  const parsed = parseImportRows(rawRows);
  const report = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as { line: number; email: string; message: string }[],
  };

  for (const row of parsed) {
    if (row.parseError) {
      report.errors.push({ line: row.lineNumber, email: row.email, message: row.parseError });
      continue;
    }

    if (row.action === "skip") {
      report.skipped++;
      continue;
    }

    try {
      const user = await prisma.user.findUnique({ where: { email: row.email } });
      if (!user) {
        report.errors.push({ line: row.lineNumber, email: row.email, message: "Utilisateur introuvable" });
        continue;
      }

      if (row.action === "create") {
        const existing = await prisma.abcMember.findUnique({ where: { userId: user.id } });
        if (existing) {
          report.errors.push({ line: row.lineNumber, email: row.email, message: "Membre déjà existant" });
          continue;
        }
        await prisma.abcMember.create({
          data: {
            userId: user.id,
            type: (row.type as any) ?? "ACTIF",
            role: (row.role as any) ?? "MEMBRE",
            status: (row.statut as any) ?? "ACTIVE",
            memberNumber: row.numero || undefined,
            membershipDate: row.dateAdhesion ? new Date(row.dateAdhesion) : undefined,
            expiresAt: row.dateExpiration ? new Date(row.dateExpiration) : undefined,
          },
        });
        report.created++;
      } else {
        // update
        const member = await prisma.abcMember.findUnique({ where: { userId: user.id } });
        if (!member) {
          report.errors.push({ line: row.lineNumber, email: row.email, message: "Membre introuvable" });
          continue;
        }
        const updateData: Record<string, unknown> = {};
        if (row.numero) updateData.memberNumber = row.numero;
        if (row.type) updateData.type = row.type; // NOTE: field is "type" not "memberType"
        if (row.role) updateData.role = row.role;
        if (row.statut) updateData.status = row.statut;
        if (row.dateAdhesion) updateData.membershipDate = new Date(row.dateAdhesion);
        if (row.dateExpiration) updateData.expiresAt = new Date(row.dateExpiration);
        await prisma.abcMember.update({ where: { id: member.id }, data: updateData });
        report.updated++;
      }
    } catch {
      report.errors.push({ line: row.lineNumber, email: row.email, message: "Erreur lors du traitement" });
    }
  }

  return NextResponse.json({ report });
}
