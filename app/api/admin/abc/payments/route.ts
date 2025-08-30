import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  AbcPaymentMode,
  AbcPaymentStatus,
  Prisma,
} from "@/lib/generated/prisma";

const createPaymentSchema = z.object({
  memberId: z.string().min(1, "Le membre est obligatoire"),
  amount: z.number().positive("Le montant doit être positif"),
  mode: z.enum(["CHEQUE", "ESPECE", "VIREMENT"]),
  checkNumber: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  year: z.number().int().min(2020).max(2030),
  quarter: z.number().int().min(1).max(4).nullable().optional(),
  status: z
    .enum(["PENDING", "PAID", "CANCELLED", "REFUNDED"])
    .default("PENDING"),
  notes: z.string().nullable().optional(),
  paidAt: z.string().datetime().nullable().optional(),
});

// GET /api/admin/abc/payments - Liste des paiements
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (
      !session?.user ||
      !safeUserCast(session.user).role ||
      !["admin", "moderator"].includes(safeUserCast(session.user).role)
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const mode = searchParams.get("mode");
    const year = searchParams.get("year");

    const skip = (page - 1) * limit;

    const where: Prisma.AbcPaymentWhereInput = {};

    if (search) {
      where.OR = [
        {
          member: {
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
        { reference: { contains: search, mode: "insensitive" } },
        { checkNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      if (["PENDING", "PAID", "CANCELLED", "REFUNDED"].includes(status)) {
        where.status = status as AbcPaymentStatus;
      } else {
        return NextResponse.json(
          { error: "Statut de paiement invalide" },
          { status: 400 }
        );
      }
    }

    if (mode) {
      if (["CHEQUE", "ESPECE", "VIREMENT"].includes(mode)) {
        where.mode = mode as AbcPaymentMode;
      } else {
        return NextResponse.json(
          { error: "Mode de paiement invalide" },
          { status: 400 }
        );
      }
    }

    if (year) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      where.createdAt = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    const [payments, total] = await Promise.all([
      prisma.abcPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.abcPayment.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/admin/abc/payments - Créer un paiement
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (
      !session?.user ||
      !safeUserCast(session.user).role ||
      !["admin", "moderator"].includes(safeUserCast(session.user).role)
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createPaymentSchema.parse(body);

    // Vérifier que le membre ABC existe
    const member = await prisma.abcMember.findUnique({
      where: { id: data.memberId },
      include: { user: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre ABC non trouvé" },
        { status: 404 }
      );
    }

    const payment = await prisma.abcPayment.create({
      data: {
        memberId: data.memberId,
        amount: data.amount,
        mode: data.mode,
        checkNumber: data.checkNumber,
        reference: data.reference,
        year: data.year,
        quarter: data.quarter,
        status: data.status,
        notes: data.notes,
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      payment,
      message: "Paiement créé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création du paiement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
