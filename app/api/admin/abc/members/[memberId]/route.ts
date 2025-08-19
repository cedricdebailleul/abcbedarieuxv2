import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateMemberSchema = z.object({
  type: z.enum(['ACTIF', 'ARTISAN', 'AUTO_ENTREPRENEUR', 'PARTENAIRE', 'BIENFAITEUR']).optional(),
  role: z.enum(['MEMBRE', 'SECRETAIRE', 'TRESORIER', 'PRESIDENT', 'VICE_PRESIDENT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED']).optional(),
  memberNumber: z.string().optional(),
  membershipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  renewedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

// GET /api/admin/abc/members/[memberId] - Détails d'un membre
export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { memberId } = await params;

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const member = await prisma.abcMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        meetings: {
          include: {
            meeting: {
              select: {
                id: true,
                title: true,
                scheduledAt: true,
                type: true,
              },
            },
          },
          orderBy: {
            meeting: {
              scheduledAt: 'desc',
            },
          },
          take: 10,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });

  } catch (error) {
    console.error("Erreur lors de la récupération du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/abc/members/[memberId] - Modifier un membre
export async function PUT(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { memberId } = await params;

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateMemberSchema.parse(body);

    // Vérifier que le membre existe
    const existingMember = await prisma.abcMember.findUnique({
      where: { id: memberId },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier l'unicité du numéro de membre si modifié
    if (data.memberNumber && data.memberNumber !== existingMember.memberNumber) {
      const existingNumber = await prisma.abcMember.findUnique({
        where: { memberNumber: data.memberNumber },
      });
      
      if (existingNumber) {
        return NextResponse.json(
          { error: "Ce numéro de membre est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (data.type) updateData.type = data.type;
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.memberNumber !== undefined) updateData.memberNumber = data.memberNumber;
    if (data.renewedAt) updateData.renewedAt = new Date(data.renewedAt);
    if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);

    const member = await prisma.abcMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      member,
      message: "Membre modifié avec succès",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la modification du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/abc/members/[memberId] - Supprimer un membre
export async function DELETE(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { memberId } = await params;

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const member = await prisma.abcMember.findUnique({
      where: { id: memberId },
      include: {
        _count: {
          select: {
            payments: true,
            meetings: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    // Empêcher la suppression s'il y a des paiements ou participations
    if (member._count.payments > 0 || member._count.meetings > 0) {
      return NextResponse.json(
        { 
          error: "Impossible de supprimer ce membre car il a des paiements ou participations enregistrés. Vous pouvez le désactiver à la place." 
        },
        { status: 400 }
      );
    }

    await prisma.abcMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      message: "Membre supprimé avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la suppression du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}