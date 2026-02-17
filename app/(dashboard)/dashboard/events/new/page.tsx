import { Metadata } from "next";
import { EventForm } from "@/components/forms/event-form";
import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma/client";

export const metadata: Metadata = {
  title: "Créer un événement - Dashboard",
  description: "Créez un nouvel événement pour votre communauté",
};

export default async function NewEventPage() {
  // Charger les places disponibles pour l'organisateur
  const places = await prisma.place.findMany({
    where: {
      status: PlaceStatus.ACTIVE,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      city: true
    },
    orderBy: [
      { name: "asc" }
    ]
  });

  return (
    <div className="container mx-auto py-8">
      <EventForm places={places} />
    </div>
  );
}