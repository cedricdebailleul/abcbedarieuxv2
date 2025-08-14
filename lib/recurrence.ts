import { RecurrenceFrequency } from "@/lib/generated/prisma";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  count?: number;
  until?: string;
  byWeekDay?: number[];
  byMonthDay?: number[];
  byMonth?: number[];
  exceptions?: string[];
  workdaysOnly?: boolean;
}

export interface EventOccurrence {
  startDate: Date;
  endDate: Date;
  isOriginal: boolean;
  originalEventId: string;
}

/**
 * Génère toutes les occurrences d'un événement récurrent dans une plage de dates
 */
export function generateRecurrenceOccurrences(
  baseStartDate: Date,
  baseEndDate: Date,
  recurrenceRule: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = [];
  const eventDuration = baseEndDate.getTime() - baseStartDate.getTime();
  
  let currentDate = new Date(baseStartDate);
  let occurrenceCount = 0;
  const maxOccurrences = recurrenceRule.count || 1000; // Limite de sécurité
  const untilDate = recurrenceRule.until ? new Date(recurrenceRule.until) : null;

  while (occurrenceCount < maxOccurrences && currentDate <= rangeEnd) {
    // Vérifier si la date est dans la plage demandée
    if (currentDate >= rangeStart) {
      const occurrenceEndDate = new Date(currentDate.getTime() + eventDuration);
      
      // Vérifier les exceptions
      const dateString = currentDate.toISOString().split('T')[0];
      if (!recurrenceRule.exceptions?.includes(dateString)) {
        // Vérifier les jours de la semaine (si spécifié)
        if (!recurrenceRule.byWeekDay || recurrenceRule.byWeekDay.includes(currentDate.getDay() || 7)) {
          // Vérifier workdaysOnly
          if (!recurrenceRule.workdaysOnly || isWorkday(currentDate)) {
            occurrences.push({
              startDate: new Date(currentDate),
              endDate: occurrenceEndDate,
              isOriginal: occurrenceCount === 0,
              originalEventId: '' // Sera rempli par l'appelant
            });
          }
        }
      }
    }

    // Calculer la prochaine occurrence
    currentDate = getNextOccurrence(currentDate, recurrenceRule);
    occurrenceCount++;

    // Vérifier la date de fin
    if (untilDate && currentDate > untilDate) {
      break;
    }
  }

  return occurrences;
}

/**
 * Calcule la prochaine occurrence selon la règle de récurrence
 */
function getNextOccurrence(currentDate: Date, rule: RecurrenceRule): Date {
  const nextDate = new Date(currentDate);
  
  switch (rule.frequency) {
    case RecurrenceFrequency.DAILY:
      nextDate.setDate(nextDate.getDate() + rule.interval);
      break;
      
    case RecurrenceFrequency.WEEKLY:
      nextDate.setDate(nextDate.getDate() + (rule.interval * 7));
      break;
      
    case RecurrenceFrequency.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + rule.interval);
      break;
      
    case RecurrenceFrequency.YEARLY:
      nextDate.setFullYear(nextDate.getFullYear() + rule.interval);
      break;
  }
  
  return nextDate;
}

/**
 * Vérifie si une date est un jour ouvrable (lundi à vendredi)
 */
function isWorkday(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5; // 1 = lundi, 5 = vendredi
}

/**
 * Expanse les événements récurrents en occurrences individuelles
 */
export function expandRecurrentEvents(
  events: any[],
  rangeStart: Date,
  rangeEnd: Date
): any[] {
  const expandedEvents: any[] = [];

  for (const event of events) {
    if (event.isRecurring && event.recurrenceRule) {
      // Parser la règle de récurrence depuis JSON
      let recurrenceRule: RecurrenceRule;
      try {
        recurrenceRule = {
          frequency: event.recurrenceRule.frequency,
          interval: event.recurrenceRule.interval,
          count: event.recurrenceRule.count,
          until: event.recurrenceRule.until,
          byWeekDay: event.recurrenceRule.byWeekDay ? JSON.parse(event.recurrenceRule.byWeekDay) : undefined,
          byMonthDay: event.recurrenceRule.byMonthDay ? JSON.parse(event.recurrenceRule.byMonthDay) : undefined,
          byMonth: event.recurrenceRule.byMonth ? JSON.parse(event.recurrenceRule.byMonth) : undefined,
          exceptions: event.recurrenceRule.exceptions ? JSON.parse(event.recurrenceRule.exceptions) : undefined,
          workdaysOnly: event.recurrenceRule.workdaysOnly || false
        };
      } catch (error) {
        console.error("Erreur parsing règle récurrence:", error);
        // Si erreur de parsing, traiter comme événement normal
        expandedEvents.push(event);
        continue;
      }

      // Générer les occurrences
      const occurrences = generateRecurrenceOccurrences(
        new Date(event.startDate),
        new Date(event.endDate),
        recurrenceRule,
        rangeStart,
        rangeEnd
      );

      // Créer un événement pour chaque occurrence
      for (const occurrence of occurrences) {
        expandedEvents.push({
          ...event,
          startDate: occurrence.startDate,
          endDate: occurrence.endDate,
          isRecurrenceOccurrence: !occurrence.isOriginal,
          originalEventId: event.id,
          occurrenceId: `${event.id}-${occurrence.startDate.toISOString()}`
        });
      }
    } else {
      // Événement non récurrent, l'ajouter tel quel s'il est dans la plage
      const eventStart = new Date(event.startDate);
      if (eventStart >= rangeStart && eventStart <= rangeEnd) {
        expandedEvents.push({
          ...event,
          isRecurrenceOccurrence: false
        });
      }
    }
  }

  return expandedEvents.sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}