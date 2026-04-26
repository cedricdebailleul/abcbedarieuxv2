import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMemberRows, membersToWorkbook, membersToCSV } from "@/lib/abc/member-export";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const role = (session?.user as any)?.role;
  if (!session?.user || !["admin", "moderator"].includes(role)) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  try {
    const members = await prisma.abcMember.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            profile: { select: { firstname: true, lastname: true, phone: true } },
          },
        },
        payments: {
          select: { year: true, amount: true, status: true, createdAt: true },
          orderBy: [{ year: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
        places: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: {
            place: {
              select: { name: true, streetNumber: true, street: true, postalCode: true, city: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const rows = buildMemberRows(members);
    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "xlsx") {
      const wb = membersToWorkbook(rows);
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="membres-abc-${dateStr}.xlsx"`,
        },
      });
    }

    const csv = membersToCSV(rows);
    return new NextResponse(new Uint8Array(csv), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="membres-abc-${dateStr}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération de l'export" }, { status: 500 });
  }
}
