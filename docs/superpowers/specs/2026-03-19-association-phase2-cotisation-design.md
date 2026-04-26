# Spec — Appels à cotisation (Phase 2 Association ABC)

**Date:** 2026-03-19
**Statut:** Approuvé

---

## Contexte

L'association ABC gère des membres avec des types (Actif, Artisan, Commerçant, etc.) et un suivi des paiements via `AbcPayment`. Il manque un outil permettant à l'admin de créer des campagnes d'appel à cotisation : sélectionner des membres, générer et envoyer un email + PDF d'avis par membre, puis suivre les états de paiement de chaque notice.

---

## 1. Schéma (Prisma)

### Nouveaux enums

```prisma
enum AbcCampaignStatus {
  DRAFT
  SENT
  CLOSED
}

enum AbcNoticeStatus {
  PENDING
  SENT
  REMINDED
  PAID
  CANCELLED
}
```

### Nouveau modèle `AbcCotisationCampaign`

```prisma
model AbcCotisationCampaign {
  id          String            @id @default(cuid())
  title       String
  year        Int
  dueDate     DateTime
  status      AbcCampaignStatus @default(DRAFT)
  description String?           @db.Text
  createdById String
  createdBy   User              @relation(fields: [createdById], references: [id])
  notices     AbcCotisationNotice[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@map("abc_cotisation_campaigns")
}
```

### Nouveau modèle `AbcCotisationNotice`

```prisma
model AbcCotisationNotice {
  id             String                @id @default(cuid())
  campaignId     String
  memberId       String
  amount         Float
  status         AbcNoticeStatus       @default(PENDING)
  sentAt         DateTime?
  reminderSentAt DateTime?
  paidAt         DateTime?
  pdfPath        String?
  notes          String?               @db.Text
  campaign       AbcCotisationCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  member         AbcMember             @relation(fields: [memberId], references: [id], onDelete: Cascade)
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  @@unique([campaignId, memberId])
  @@index([status])
  @@index([memberId])
  @@map("abc_cotisation_notices")
}
```

### Modifications aux modèles existants

- `AbcMember` : ajouter `cotisationNotices AbcCotisationNotice[]`
- `User` : ajouter `abcCotisationCampaigns AbcCotisationCampaign[]`

### Statut LATE

Non stocké en base — calculé à l'affichage :
`status IN (SENT, REMINDED) && campaign.dueDate < now()` → afficher le badge "En retard" en rouge.
Évite un job de synchronisation en base.

### Lien avec AbcPayment

Quand l'admin crée un paiement (`AbcPayment`) pour un membre sur la même année qu'une campagne, l'API de création de paiement recherche une `AbcCotisationNotice` correspondante (`memberId` + `campaign.year === payment.year`) et la passe automatiquement en `PAID` + `paidAt = now()`.

### Montants par défaut

Les montants par défaut par type de membre sont définis côté serveur dans une constante :

```typescript
// lib/abc/cotisation-defaults.ts
export const DEFAULT_AMOUNTS: Record<AbcMemberType, number> = {
  ACTIF: 50,
  ARTISAN: 30,
  COMMERCANT: 40,
  ASSOCIATION: 25,
  SYMPATHISANT: 15,
  HONORAIRE: 0,
}
```

L'admin peut modifier le montant par membre avant l'envoi (champ `amount` sur `AbcCotisationNotice`).

---

## 2. API Endpoints

Base : `/api/admin/abc/cotisation/`

### Campagnes

| Méthode | Route | Action |
|---|---|---|
| GET | `/campaigns` | Liste toutes les campagnes, avec compteurs par statut notice |
| POST | `/campaigns` | Crée une campagne `DRAFT` |
| GET | `/campaigns/[id]` | Détail campagne + notices paginées |
| PUT | `/campaigns/[id]` | Modifie titre/description/dueDate (DRAFT uniquement) |
| DELETE | `/campaigns/[id]` | Supprime campagne + notices (DRAFT uniquement) |
| POST | `/campaigns/[id]/send` | Envoie les emails+PDFs aux notices PENDING → passe en SENT |
| POST | `/campaigns/[id]/remind` | Envoie rappels aux notices SENT non payées → passe en REMINDED |

**POST `/campaigns`** body :
```json
{
  "title": "Cotisation 2026",
  "year": 2026,
  "dueDate": "2026-04-30T00:00:00.000Z",
  "description": "Appel à cotisation annuel"
}
```

**POST `/campaigns/[id]/send`** : déclenche l'envoi. Ne peut être appelé que si `status === DRAFT`. Passe la campagne en `SENT` après envoi. En cas d'erreur partielle (certains emails échouent), les notices en échec restent `PENDING`.

**POST `/campaigns/[id]/remind`** : envoie des rappels aux notices dont `status === SENT` (pas encore payées). Ne touche pas les notices `PAID` / `CANCELLED` / `REMINDED`.

### Notices

| Méthode | Route | Action |
|---|---|---|
| POST | `/campaigns/[id]/notices/bulk` | Ajoute des membres en batch |
| DELETE | `/campaigns/[id]/notices/[noticeId]` | Supprime une notice (DRAFT seulement) |
| PATCH | `/campaigns/[id]/notices/[noticeId]` | Modifie montant ou passe en PAID/CANCELLED manuellement |
| GET | `/campaigns/[id]/notices/[noticeId]/pdf` | Télécharge le PDF de la notice |

**POST `/campaigns/[id]/notices/bulk`** body :
```json
{
  "members": [
    { "memberId": "...", "amount": 50 },
    { "memberId": "...", "amount": 30 }
  ]
}
```
- Ignore les doublons (membres déjà dans la campagne) silencieusement.
- Utilise le montant par défaut du type membre si `amount` non fourni.

**PATCH `/campaigns/[id]/notices/[noticeId]`** body autorisé :
```json
{ "amount": 45 }           // modifier montant (PENDING/SENT/REMINDED)
{ "status": "PAID" }       // marquer payé manuellement
{ "status": "CANCELLED" }  // annuler
{ "notes": "..." }         // ajouter une note
```

### Codes HTTP

- `401` — non authentifié
- `403` — non admin/moderateur
- `404` — campagne ou notice non trouvée (catch `P2025`)
- `409` — action non autorisée (ex : supprimer une campagne SENT)
- `422` — données invalides (montant négatif, etc.)

---

## 3. Génération PDF

Chaque notice génère un PDF via la librairie `@react-pdf/renderer` (déjà utilisée dans le projet) ou `puppeteer` si besoin de rendu HTML complet.

**Contenu du PDF :**
- Logo + nom de l'association ABC
- Titre : "Appel à Cotisation [année]"
- Destinataire : prénom + nom + email du membre
- Type de membre + montant dû
- Date d'échéance
- Instructions de paiement (virement bancaire / espèces en réunion)
- Date d'émission

**Stockage :** `public/uploads/cotisation/[campaignId]/[noticeId].pdf`

**Accès :** `/api/admin/abc/cotisation/campaigns/[id]/notices/[noticeId]/pdf` — authentification admin requise.

---

## 4. Emails

### Email d'appel initial

- **Objet :** `Cotisation ABC Bédarieux [année] — Merci de régler avant le [dueDate]`
- **Corps :** salutation personnalisée + montant + date d'échéance + lien de téléchargement du PDF + coordonnées bancaires
- **Template :** HTML réutilisant le système email existant (`lib/email.ts`)

### Email de rappel

- **Objet :** `Rappel — Cotisation ABC Bédarieux [année] en attente`
- **Corps :** identique mais avec mention "Ceci est un rappel" en tête

---

## 5. UI

### Page liste — `/dashboard/admin/abc/cotisation`

- Tableau des campagnes avec colonnes : Titre, Année, Échéance, Statut, Payés / Total, Actions
- Statuts affichés : BROUILLON (gris), ENVOYÉ (bleu), FERMÉ (vert)
- Badge "X en retard" en rouge si `dueDate` dépassée et notices SENT/REMINDED non payées
- Boutons par campagne : Voir, Rappeler (si SENT), Clôturer
- Bouton "Nouvelle campagne" en haut à droite

### Page détail campagne — `/dashboard/admin/abc/cotisation/[id]`

- **4 cartes stats :** Payés / En attente / Relancés / Annulés
- **Bouton "Ajouter membres"** → dialog de sélection multi-membres avec montants éditables
- **Bouton "Envoyer (N)"** → confirmation + envoi batch (DRAFT → SENT)
- **Bouton "Envoyer rappels (N)"** → confirmation + envoi rappels (pour SENT non payées)
- **Tableau notices :** Membre, Montant, Statut (badge coloré + "En retard" calculé), Envoyé le, Actions
- **Actions par notice :** Télécharger PDF, Marquer payé, Annuler, Modifier montant

### Navigation

Ajouter un lien "Appels à cotisation" dans le menu admin ABC (sidebar ou onglets existants).

---

## 6. Critères d'acceptation

| # | Critère |
|---|---------|
| 1 | Les tables `abc_cotisation_campaigns` et `abc_cotisation_notices` sont créées en base |
| 2 | L'admin peut créer une campagne DRAFT et y ajouter des membres |
| 3 | Le montant par défaut est pré-rempli selon le type membre, modifiable |
| 4 | L'admin peut envoyer les avis (email + PDF) aux membres sélectionnés |
| 5 | Le statut des notices passe de PENDING à SENT après envoi |
| 6 | L'admin peut envoyer des rappels aux notices SENT non payées |
| 7 | La page détail affiche les 4 cartes stats et le tableau des notices |
| 8 | Le badge "En retard" s'affiche si `dueDate` dépassée et notice SENT/REMINDED |
| 9 | Marquer une notice comme PAID met à jour `paidAt` |
| 10 | Créer un `AbcPayment` sur la même année marque automatiquement la notice en PAID |
| 11 | Supprimer une campagne SENT retourne `409` |
| 12 | Le PDF est généré et téléchargeable par l'admin |

---

## 7. Hors périmètre

- Paiement en ligne (pas de lien Stripe ou PayPal)
- Rappels automatiques programmés (timer/cron) — rappels manuels uniquement
- Stats avancées par campagne (taux de conversion, délai moyen de paiement)
- Import CSV de membres depuis l'écran cotisation (utiliser l'import membres existant)
- Notifications membre dans l'app (email uniquement)
