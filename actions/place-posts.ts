"use server";

import { prisma } from "@/lib/prisma";
import { PostStatus } from "@/lib/generated/prisma/client";
import { ActionResult } from "@/lib/types";

export async function getPlacePostsAction(
  placeId: string,
  limit: number = 10
): Promise<
  ActionResult<
    {
      id: string;
      title: string;
      slug: string;
      excerpt?: string | null;
      content?: string | null;
      published: boolean;
      publishedAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
      coverImage?: string | null;
      author: { id: string; name: string; image?: string | null };
      category?: {
        id: string;
        name: string;
        slug: string;
        color?: string | null;
      } | null;
      place?: {
        id: string;
        name: string;
        slug: string;
        type: string;
        city?: string | null;
      } | null;
      tags: Array<{
        tag: { id: string; name: string; slug: string; color?: string | null };
      }>;
    }[]
  >
> {
  try {
    const posts = await prisma.post.findMany({
      where: {
        placeId,
        published: true,
        status: PostStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        place: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            city: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: limit,
    });

    return {
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        published: post.published,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        coverImage: post.coverImage,
        author: {
          id: post.author.id,
          name: post.author.name || "Utilisateur",
          image: post.author.image,
        },
        category: post.category
          ? {
              id: post.category.id,
              name: post.category.name,
              slug: post.category.slug,
              color: post.category.color,
            }
          : null,
        place: post.place
          ? {
              id: post.place.id,
              name: post.place.name,
              slug: post.place.slug,
              type: post.place.type,
              city: post.place.city,
            }
          : null,
        tags: post.tags.map((tag) => ({
          tag: {
            id: tag.tag.id,
            name: tag.tag.name,
            slug: tag.tag.slug,
            color: tag.tag.color,
          },
        })),
      })),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des posts du lieu:", error);

    return {
      success: false,
      error: "Erreur lors de la récupération des articles",
    };
  }
}
