import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CACHE_DURATION = 10 * 60; // 10 minutes

export async function GET(request: Request) {
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

    const [
      totalMembers,
      membersByType,
      totalPayments,
      paymentsByMode,
      recentPayments,
      pendingPayments,
      paymentsByMonth
    ] = await Promise.all([
      // Total des membres
      prisma.abcMember.count(),

      // Répartition par type
      prisma.abcMember.groupBy({
        by: ['type'],
        _count: true,
      }),

      // Total des paiements
      prisma.abcPayment.aggregate({
        _sum: { amount: true },
        _count: true,
      }),

      // Paiements par mode
      prisma.abcPayment.groupBy({
        by: ['mode'],
        _sum: { amount: true },
        _count: true,
      }),

      // 5 derniers paiements
      prisma.abcPayment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        },
      }),

      // Paiements en attente
      prisma.abcPayment.count({
        where: { status: 'PENDING' }
      }),

      // Paiements des 12 derniers mois
      prisma.abcPayment.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          amount: true,
          createdAt: true,
        }
      })
    ]);

    // Traitement des données mensuelles
    const monthlyData = paymentsByMonth.reduce((acc, payment) => {
      const month = payment.createdAt.toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      overview: {
        totalMembers,
        totalPayments: totalPayments._sum.amount || 0,
        totalTransactions: totalPayments._count,
        pendingPayments,
      },
      membersByType: membersByType.map(item => ({
        type: item.type,
        count: item._count,
      })),
      paymentsByMode: paymentsByMode.map(item => ({
        mode: item.mode,
        count: item._count,
        total: item._sum.amount || 0,
      })),
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        mode: payment.mode,
        status: payment.status,
        createdAt: payment.createdAt,
        member: {
          type: payment.member.type,
          user: payment.member.user,
        },
      })),
      monthlyPayments: Object.entries(monthlyData).map(([month, total]) => ({
        month,
        total,
      })).slice(-12),
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_DURATION}`,
      },
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des stats ABC:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}