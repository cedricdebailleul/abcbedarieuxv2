import z from "zod";
import { prisma } from "../lib/prisma";
const profileSchema = z.object({
  firstname: z.string().min(1).max(50),
  lastname: z.string().min(1).max(50),
});

export async function getProfileByUserId(userId: string) {
  return await prisma.profile.findUnique({
    where: { userId },
  });
}

export async function updateProfile(
  userId: string,
  data: { firstname: string; lastname: string }
) {
  const validated = profileSchema.safeParse(data);
  if (!validated.success) {
    throw new Error("Invalid profile data");
  }
  return await prisma.profile.upsert({
    where: { userId },
    update: validated.data,
    create: {
      userId,
      ...validated.data,
    },
  });
}
