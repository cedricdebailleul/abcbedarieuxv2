#!/usr/bin/env tsx

import { createEventAction } from "@/actions/event";
import { RecurrenceFrequency, EventStatus, EventCategory } from "@/lib/generated/prisma";

async function testEventRecurrence() {
  console.log("🧪 Test de création d'événement récurrent");

  const testEventData = {
    title: "Test Event Récurrent",
    description: "Un événement de test avec récurrence",
    summary: "Test récurrence",
    status: EventStatus.DRAFT,
    startDate: "2025-01-15T18:00:00",
    endDate: "2025-01-15T20:00:00",
    isAllDay: false,
    timezone: "Europe/Paris",
    locationName: "Salle de test",
    locationCity: "Bédarieux",
    isFree: true,
    category: EventCategory.WORKSHOP,
    isRecurring: true,
    recurrence: {
      frequency: RecurrenceFrequency.WEEKLY,
      interval: 1,
      count: 5,
      byWeekDay: [3], // Mercredi
      workdaysOnly: false
    }
  };

  try {
    console.log("📤 Envoi des données:", JSON.stringify(testEventData, null, 2));
    
    const result = await createEventAction(testEventData);
    
    if (result.success) {
      console.log("✅ Événement créé avec succès:", result.data);
    } else {
      console.log("❌ Erreur lors de la création:", result.error);
    }
  } catch (error) {
    console.error("💥 Exception:", error);
  }
}

testEventRecurrence();