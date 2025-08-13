-- Script de test pour créer directement un événement récurrent

-- 1. Créer une règle de récurrence
INSERT INTO "recurrenceRules" (
  "id", "frequency", "interval", "count", "workdaysOnly", "createdAt", "updatedAt"
) VALUES (
  'test-recurrence-rule-001',
  'WEEKLY',
  1,
  4,
  false,
  NOW(),
  NOW()
);

-- 2. Créer un événement récurrent lié à cette règle
INSERT INTO "events" (
  "id", "title", "slug", "description", "summary", "startDate", "endDate", 
  "isAllDay", "timezone", "locationName", "locationCity", "isFree", 
  "isRecurring", "recurrenceRuleId", "organizerId", "status", "isPublished", 
  "isActive", "isFeatured", "participantCount", "createdAt", "updatedAt"
) VALUES (
  'test-event-recurring-001',
  'Test Événement Récurrent SQL',
  'test-evenement-recurrent-sql',
  'Un événement de test créé directement en SQL pour vérifier la récurrence',
  'Test récurrence SQL',
  '2025-01-20 18:00:00',
  '2025-01-20 20:00:00',
  false,
  'Europe/Paris',
  'Salle de test SQL',
  'Bédarieux',
  true,
  true,
  'test-recurrence-rule-001',
  'EjUpzh5F00NJThH7dR9a9825uGCSc2A3',
  'PUBLISHED',
  true,
  true,
  false,
  0,
  NOW(),
  NOW()
);

-- 3. Vérifier ce qui a été créé
SELECT 
  e.id, e.title, e.isRecurring, 
  rr.frequency, rr.interval, rr.count
FROM "events" e
LEFT JOIN "recurrenceRules" rr ON e."recurrenceRuleId" = rr.id
WHERE e.slug = 'test-evenement-recurrent-sql';