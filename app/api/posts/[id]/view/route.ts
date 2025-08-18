import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Capturer les informations du visiteur
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const referer = request.headers.get('referer') || '';

    // Vérifier si l'article existe
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, title: true, viewCount: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }

    // Éviter les vues en double de la même IP dans les 10 dernières minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const existingView = await prisma.postView.findFirst({
      where: {
        postId: id,
        ipAddress: clientIp,
        createdAt: {
          gte: tenMinutesAgo
        }
      }
    });

    if (existingView) {
      return NextResponse.json({ 
        message: "Vue déjà enregistrée récemment",
        viewCount: post.viewCount 
      });
    }

    // Enregistrer la vue et incrémenter le compteur
    await Promise.all([
      // Créer l'enregistrement de vue
      prisma.postView.create({
        data: {
          postId: id,
          ipAddress: clientIp,
          userAgent,
          referer: referer.substring(0, 255), // Limiter la longueur
          createdAt: new Date()
        }
      }),
      // Incrémenter le compteur de vues
      prisma.post.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1
          }
        }
      })
    ]);

    const updatedPost = await prisma.post.findUnique({
      where: { id },
      select: { viewCount: true }
    });

    return NextResponse.json({ 
      message: "Vue enregistrée",
      viewCount: updatedPost?.viewCount || post.viewCount + 1
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la vue:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la vue" },
      { status: 500 }
    );
  }
}