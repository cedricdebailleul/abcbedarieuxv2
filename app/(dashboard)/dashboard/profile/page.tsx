import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ProfileContent from "./_components/profile-content";

export default async function ProfilePage() {
  // Vérifier l'authentification
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Récupérer les données complètes de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      badges: {
        include: {
          badge: true,
        },
        where: {
          isVisible: true,
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
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return <ProfileContent user={user} />;
}
