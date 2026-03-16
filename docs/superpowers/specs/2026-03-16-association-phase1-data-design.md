# Spec — Association ABC Phase 1 : Données membres

**Date** : 2026-03-16
**Statut** : Approuvé
**Périmètre** : Phase 1 sur 3 — Import/Export membres + Lien membre↔place

---

## Contexte

Le système association ABC Bédarieux dispose déjà d'une base solide : gestion des membres, paiements, réunions, bulletins, documents et inscriptions sont fonctionnels. Cette phase 1 ajoute deux fonctionnalités manquantes à haute valeur :

1. **Import/Export CSV & XLSX** des membres avec toutes leurs données
2. **Lien bidirectionnel membre ↔ place** (commerce du site)

Les phases 2 et 3 couvriront : appels à cotisation, présences réunions, espace membre amélioré, actions en masse, tableaux de bord graphiques.

---

## Fonctionnalité 1 — Import / Export membres

### Export

- **Déclencheur** : bouton "Exporter" dans la barre d'actions de `/dashboard/admin/abc/members`
- **Formats** : CSV (`.csv`) et Excel (`.xlsx`) au choix via un menu déroulant
- **Colonnes exportées** (dans l'ordre) :

| Colonne | Description |
|---|---|
| `action` | Pré-rempli à `update` — pour réimport direct |
| `numero` | Numéro de membre |
| `nom` | Nom de famille |
| `prenom` | Prénom |
| `email` | Email principal |
| `telephone` | Téléphone |
| `type` | Type de membre (ACTIF, ARTISAN, etc.) |
| `role` | Rôle dans l'association (MEMBRE, PRESIDENT, etc.) |
| `statut` | Statut (ACTIVE, INACTIVE, SUSPENDED, EXPIRED) |
| `dateAdhesion` | Date d'adhésion (ISO 8601) |
| `dateExpiration` | Date d'expiration (ISO 8601) |
| `cotisationAnnee` | Année de la dernière cotisation |
| `cotisationMontant` | Montant de la dernière cotisation |
| `cotisationStatut` | Statut de la dernière cotisation (PAID, PENDING, etc.) |
| `placeNom` | Nom du 1er commerce lié (vide si aucun) |
| `placeAdresse` | Adresse du 1er commerce lié |

- **Fichier XLSX** : en-têtes en gras, colonnes auto-dimensionnées, nom de fichier `membres-abc-YYYY-MM-DD.xlsx`
- **Fichier CSV** : encodage UTF-8 avec BOM (compatible Excel Windows), séparateur `;`

### Import

- **Déclencheur** : bouton "Importer" dans la barre d'actions → modal d'upload
- **Formats acceptés** : `.csv` et `.xlsx`
- **Colonne `action`** obligatoire dans le fichier :
  - `create` — crée un nouveau membre (erreur si l'email existe déjà)
  - `update` — met à jour le membre identifié par email (erreur si inexistant)
  - `skip` — ligne ignorée silencieusement
- **Comportement** :
  - Validation de toutes les lignes avant tout écriture
  - Si des erreurs critiques (format de colonne invalide) → import bloqué, rapport affiché
  - Sinon : traitement ligne par ligne, les erreurs n'interrompent pas les autres lignes
- **Rapport post-import** affiché dans la modal :
  - Nombre de membres créés
  - Nombre de membres mis à jour
  - Nombre de lignes ignorées (`skip`)
  - Tableau des erreurs (numéro de ligne, email, message d'erreur)

### API

```
GET  /api/admin/abc/members/export?format=csv|xlsx
POST /api/admin/abc/members/import   (multipart/form-data, champ: file)
```

### Librairies

- **`xlsx`** (SheetJS) pour lecture/écriture XLSX et CSV — à ajouter en dépendance

---

## Fonctionnalité 2 — Lien membre ↔ place

### Schéma base de données

Nouveau modèle **`AbcMemberPlace`** (table de liaison) :

```prisma
model AbcMemberPlace {
  id        String    @id @default(cuid())
  memberId  String
  placeId   String
  role      String    @default("GERANT") // GERANT | ASSOCIE | SALARIE | AUTRE
  member    AbcMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  place     Place     @relation(fields: [placeId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now())

  @@unique([memberId, placeId])
  @@index([memberId])
  @@index([placeId])
  @@map("abc_member_places")
}
```

Modifications additives sur les modèles existants :
- `AbcMember` : ajout `places AbcMemberPlace[]`
- `Place` : ajout `abcMembers AbcMemberPlace[]`

**Aucune colonne existante modifiée. Migration additive, zéro perte de données.**

### UI — Dialog édition membre

- Ajout d'un onglet **"Commerces"** dans le dialog `edit-member-dialog`
- Contenu de l'onglet :
  - Liste des places liées : nom du commerce + badge rôle + bouton supprimer le lien
  - Bouton "Ajouter un commerce" → searchable combobox sur les `Place` existantes + select rôle (GÉRANT / ASSOCIÉ / SALARIÉ / AUTRE)
  - Sauvegarde immédiate (pas de "enregistrer" intermédiaire — PATCH direct)

### UI — Tableau membres admin

- Nouvelle colonne **"Commerce(s)"** dans le tableau de `/dashboard/admin/abc/members`
- Affiche : nom de la 1ère place liée
- Si plusieurs places : nom + badge "+N"
- Si aucune place : cellule vide

### UI — Page places admin

- Section **"Membres ABC"** ajoutée en lecture seule sur la fiche d'une place (si une page détail place admin existe)
- Si la page détail n'existe pas : intégration dans la page liste places avec un indicateur de membres liés

### API

```
GET    /api/admin/abc/members/[memberId]/places          — liste des places d'un membre
POST   /api/admin/abc/members/[memberId]/places          — ajouter un lien
DELETE /api/admin/abc/members/[memberId]/places/[placeId] — supprimer un lien
GET    /api/admin/places/[placeId]/abc-members            — membres liés à une place
```

---

## Contraintes techniques

- Next.js 15 App Router — les nouvelles pages/composants suivent les patterns existants
- Prisma ORM — migration `db:push` (projet utilise push, pas migrate)
- Composants UI : shadcn/ui existants (Dialog, Tabs, Command/Combobox, Badge, Table)
- Pas de nouvelles dépendances UI — seulement `xlsx` (SheetJS) pour import/export
- Toutes les routes API protégées par vérification de rôle admin/moderateur

---

## Hors périmètre (Phase 2 et 3)

- Appels à cotisation et relances email
- Gestion des présences aux réunions
- Espace membre amélioré
- Actions en masse sur membres
- Tableaux de bord avec graphiques

---

## Critères d'acceptation

- [ ] Export CSV d'un membre avec place liée produit toutes les colonnes attendues
- [ ] Export XLSX s'ouvre correctement dans Excel/LibreOffice
- [ ] Import avec colonne `action=create` crée un nouveau membre
- [ ] Import avec colonne `action=update` met à jour un membre existant par email
- [ ] Import avec `action=skip` ignore la ligne sans erreur
- [ ] Un email dupliqué sur `action=create` produit une erreur dans le rapport, sans bloquer les autres lignes
- [ ] Le rapport post-import affiche le décompte créés/mis à jour/ignorés/erreurs
- [ ] L'onglet "Commerces" dans edit-member permet d'ajouter/supprimer des liens
- [ ] La colonne "Commerce(s)" s'affiche dans le tableau membres
- [ ] La table `abc_member_places` est créée en base sans affecter les données existantes
