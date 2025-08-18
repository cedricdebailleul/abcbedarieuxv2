import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers())
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, 1y

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Statistiques générales des vues
    const [totalViews, periodViews, uniqueViewers, topPosts, viewsOverTime, viewsByReferer] = await Promise.all([
      // Total des vues
      prisma.postView.count(),
      
      // Vues de la période
      prisma.postView.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Visiteurs uniques de la période (par IP)
      prisma.postView.groupBy({
        by: ['ipAddress'],
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _count: {
          ipAddress: true
        }
      }).then(results => results.length),
      
      // Top articles les plus vus
      prisma.post.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          author: {
            select: {
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              views: {
                where: {
                  createdAt: {
                    gte: startDate
                  }
                }
              }
            }
          }
        },
        orderBy: {
          viewCount: 'desc'
        },
        take: 10
      }),
      
      // Évolution des vues dans le temps
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as views,
          COUNT(DISTINCT "ipAddress") as unique_visitors
        FROM "post_views" 
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      
      // Top referrers
      prisma.postView.groupBy({
        by: ['referer'],
        where: {
          createdAt: {
            gte: startDate
          },
          referer: {
            not: ""
          }
        },
        _count: {
          referer: true
        },
        orderBy: {
          _count: {
            referer: 'desc'
          }
        },
        take: 10
      })
    ]);

    // Calculer les statistiques de croissance
    const previousPeriodViews = await prisma.postView.count({
      where: {
        createdAt: {
          gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
          lt: startDate
        }
      }
    });

    const growthRate = previousPeriodViews > 0 
      ? ((periodViews - previousPeriodViews) / previousPeriodViews) * 100 
      : 0;

    // Formater les données temporelles
    const formattedViewsOverTime = (viewsOverTime as any[]).map(row => ({
      date: row.date.toISOString().split('T')[0],
      views: parseInt(row.views.toString()),
      uniqueVisitors: parseInt(row.unique_visitors.toString())
    }));

    // Nettoyer et formater les referrers
    const formattedReferrers = viewsByReferer.map(ref => {
      let domain = ref.referer;
      try {
        const url = new URL(ref.referer);
        domain = url.hostname;
      } catch {
        // Garder la valeur originale si ce n'est pas une URL valide
      }
      
      return {
        domain,
        count: ref._count.referer
      };
    });

    return NextResponse.json({
      // Métriques principales
      totalViews,
      periodViews,
      uniqueViewers,
      growthRate: Math.round(growthRate * 100) / 100,
      
      // Données détaillées
      topPosts: topPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        totalViews: post.viewCount,
        periodViews: post._count.views,
        author: {
          name: post.author.name,
          email: post.author.email?.replace(/(.{3}).*@/, '$1***@')
        }
      })),
      
      // Données temporelles
      viewsOverTime: formattedViewsOverTime,
      
      // Sources de trafic
      topReferrers: formattedReferrers,
      
      // Métadonnées
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de vues:', error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques de vues" },
      { status: 500 }
    );
  }
}