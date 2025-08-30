import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const updateMeetingSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire").optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['GENERAL', 'BUREAU', 'EXTRAORDINAIRE', 'COMMISSION']).optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().positive().nullable().optional(),
  location: z.string().nullable().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

// GET /api/admin/abc/meetings/[meetingId] - Détails d'une réunion
export async function GET(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { meetingId } = await params;

    if (!session?.user || !safeUserCast(session.user).role || !["admin", "moderator"].includes(safeUserCast(session.user).role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const meeting = await prisma.abcMeeting.findUnique({
      where: { id: meetingId },
      include: {
        attendees: {
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
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Réunion non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ meeting });

  } catch (error) {
    console.error("Erreur lors de la récupération de la réunion:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/abc/meetings/[meetingId] - Modifier une réunion
export async function PUT(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { meetingId } = await params;

    if (!session?.user || !safeUserCast(session.user).role || !["admin", "moderator"].includes(safeUserCast(session.user).role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateMeetingSchema.parse(body);

    // Vérifier que la réunion existe
    const existingMeeting = await prisma.abcMeeting.findUnique({
      where: { id: meetingId },
    });

    if (!existingMeeting) {
      return NextResponse.json(
        { error: "Réunion non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la date est dans le futur si elle est modifiée
    if (data.scheduledAt) {
      const scheduledDate = new Date(data.scheduledAt);
      if (scheduledDate <= new Date() && existingMeeting.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: "La date de la réunion doit être dans le futur" },
          { status: 400 }
        );
      }
    }

    const updateData: Partial<{
      title: string;
      description: string | null;
      type: 'GENERAL' | 'BUREAU' | 'EXTRAORDINAIRE' | 'COMMISSION';
      scheduledAt: Date;
      duration: number | null;
      location: string | null;
      status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    }> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.type) updateData.type = data.type;
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.duration !== undefined) updateData.duration = data.duration || null;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.status) updateData.status = data.status;

    const meeting = await prisma.abcMeeting.update({
      where: { id: meetingId },
      data: updateData,
      include: {
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    return NextResponse.json({
      meeting,
      message: "Réunion modifiée avec succès",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la modification de la réunion:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/abc/meetings/[meetingId] - Supprimer une réunion
export async function DELETE(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { meetingId } = await params;

    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const meeting = await prisma.abcMeeting.findUnique({
      where: { id: meetingId },
      include: {
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Réunion non trouvée" },
        { status: 404 }
      );
    }

    // Empêcher la suppression si la réunion est en cours ou terminée
    if (['IN_PROGRESS', 'COMPLETED'].includes(meeting.status)) {
      return NextResponse.json(
        { 
          error: "Impossible de supprimer une réunion en cours ou terminée" 
        },
        { status: 400 }
      );
    }

    // Supprimer d'abord les participations, puis la réunion
    await prisma.$transaction([
      prisma.abcMeetingAttendee.deleteMany({
        where: { meetingId },
      }),
      prisma.abcMeeting.delete({
        where: { id: meetingId },
      }),
    ]);

    return NextResponse.json({
      message: "Réunion supprimée avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de la réunion:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}