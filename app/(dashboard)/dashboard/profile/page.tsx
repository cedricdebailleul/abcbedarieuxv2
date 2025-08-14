import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileContent from "./_components/profile-content";

export default async function ProfilePage() {
  // La session est garantie par le layout parent
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Récupérer les données complètes de l'utilisateur et tous les badges
  if (!session || !session.user) {
    redirect("/login");
  }

  const [user, allBadges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        badges: {
          include: {
            badge: true,
          },
          orderBy: {
            earnedAt: "desc",
          },
        },
        _count: {
          select: {
            posts: true,
            sessions: true,
          },
        },
      },
    }),
    prisma.badge.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ category: "asc" }, { rarity: "asc" }, { title: "asc" }],
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileContent
      user={{
        ...user,
        profile: user.profile
          ? {
              firstname: user.profile.firstname || undefined,
              lastname: user.profile.lastname || undefined,
              bio: user.profile.bio || undefined,
              phone: user.profile.phone || undefined,
              address: undefined,
              language: undefined,
              timezone: user.profile.timezone || undefined,
              isPublic: false, // Default value, adjust as needed
              showEmail: false, // Default value, adjust as needed
              showPhone: user.profile.showPhone,
            }
          : undefined,
      }}
      allBadges={allBadges.map((badge) => ({
        ...badge,
        iconUrl: badge.iconUrl ?? undefined,
        color: badge.color ?? undefined,
      }))}
    />
  );
}
