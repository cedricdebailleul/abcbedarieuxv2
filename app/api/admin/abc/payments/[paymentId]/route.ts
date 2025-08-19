import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updatePaymentSchema = z.object({
  memberId: z.string().min(1, "Le membre est obligatoire"),
  amount: z.number().positive("Le montant doit être positif"),
  mode: z.enum(['CHEQUE', 'ESPECE', 'VIREMENT']),
  checkNumber: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  year: z.number().int().min(2020).max(2030),
  quarter: z.number().int().min(1).max(4).nullable().optional(),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']),
  notes: z.string().nullable().optional(),
  paidAt: z.string().datetime().nullable().optional(),
});

// GET /api/admin/abc/payments/[paymentId] - Récupérer un paiement
export async function GET(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const payment = await prisma.abcPayment.findUnique({
      where: { id: params.paymentId },
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

    if (!payment) {
      return NextResponse.json(
        { error: "Paiement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment });

  } catch (error) {
    console.error("Erreur lors de la récupération du paiement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/abc/payments/[paymentId] - Modifier un paiement
export async function PUT(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updatePaymentSchema.parse(body);

    // Vérifier que le paiement existe
    const existingPayment = await prisma.abcPayment.findUnique({
      where: { id: params.paymentId },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Paiement non trouvé" },
        { status: 404 }
      );
    }

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

    const payment = await prisma.abcPayment.update({
      where: { id: params.paymentId },
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
        updatedAt: new Date(),
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
      message: "Paiement modifié avec succès",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la modification du paiement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/abc/payments/[paymentId] - Supprimer un paiement
export async function DELETE(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que le paiement existe
    const payment = await prisma.abcPayment.findUnique({
      where: { id: params.paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Paiement non trouvé" },
        { status: 404 }
      );
    }

    // Empêcher la suppression des paiements payés (sauf pour les admins)
    if (payment.status === "PAID" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer un paiement payé" },
        { status: 403 }
      );
    }

    await prisma.abcPayment.delete({
      where: { id: params.paymentId },
    });

    return NextResponse.json({
      message: "Paiement supprimé avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la suppression du paiement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}