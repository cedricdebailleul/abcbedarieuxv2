# Spec — Association ABC Phase 1 : Données membres

**Date** : 2026-03-16
**Statut** : Approuvé
**Périmètre** : Phase 1 sur 3 — Import/Export membres + Lien membre↔place

---

## Contexte

Le système association ABC Bédarieux dispose déjà d'une base solide : gestion des membres, paiements, réunions, bulletins, documents et inscriptions sont fonctionnels. Cette phase 1 ajoute deux fonctionnalités manquantes à haute valeur :

1. **Import/Export CSV & XLSX** des membres avec toutes leurs données
2. **Lien bidirectionnel membre ↔ place** (commerce du site)

**Ordre d'implémentation** : Fonctionnalité 2 (schéma + migration) doit être réalisée en premier car l'export dépend de la table `abc_member_places`.

Les phases 2 et 3 couvriront : appels à cotisation, présences réunions, espace membre amélioré, actions en masse, tableaux de bord graphiques.

---

## Mapping des champs dans le schéma existant

`AbcMember` ne stocke pas directement le nom, prénom ou téléphone — ces données vivent sur les modèles liés :

| Colonne export | Source dans le schéma |
|---|---|
| `nom` | `member.user.profile.lastName` — fallback : split de `user.name` sur le premier espace (partie droite) |
| `prenom` | `member.user.profile.firstName` — fallback : split de `user.name` sur le premier espace (partie gauche) |
| `email` | `member.user.email` |
| `telephone` | `member.user.profile.phone` — vide si absent |
| `numero` | `member.memberNumber` |
| `type` | `member.memberType` |
| `role` | `member.role` |
| `statut` | `member.status` |
| `dateAdhesion` | `member.joinDate` |
| `dateExpiration` | `member.expiryDate` |

Lors de l'**import** :
- La résolution se fait par email → `User.email` → `AbcMember` via `userId`
- `action=create` : l'email doit correspondre à un `User` existant. Si aucun `User` n'est trouvé → erreur par ligne (l'import ne crée pas de comptes `User`). Si le `User` existe mais a déjà un `AbcMember` → erreur.
- `action=update` : si aucun `User` trouvé OU aucun `AbcMember` lié → erreur par ligne
- Les champs `nom`, `prenom`, `telephone` en import sont ignorés (lecture seule, gérés via le profil utilisateur)

---

## Fonctionnalité 1 — Import / Export membres

### Export

- **Déclencheur** : bouton "Exporter" dans la barre d'actions de `/dashboard/admin/abc/members`
- **Formats** : CSV (`.csv`) et Excel (`.xlsx`) au choix via un menu déroulant
- **Colonnes exportées** (dans l'ordre) :

| Colonne | Description | Source |
|---|---|---|
| `action` | Pré-rempli à `update` — pour réimport direct | statique |
| `numero` | Numéro de membre | `memberNumber` |
| `nom` | Nom de famille | `user.profile.lastName` ou split `user.name` |
| `prenom` | Prénom | `user.profile.firstName` ou split `user.name` |
| `email` | Email principal | `user.email` |
| `telephone` | Téléphone | `user.profile.phone` (vide si absent) |
| `type` | Type de membre (ACTIF, ARTISAN, etc.) | `memberType` |
| `role` | Rôle dans l'association | `role` |
| `statut` | Statut du membre | `status` |
| `dateAdhesion` | Date d'adhésion (ISO 8601) | `joinDate` |
| `dateExpiration` | Date d'expiration (ISO 8601) | `expiryDate` |
| `cotisationAnnee` | Année de la cotisation la plus récente | `payments` trié par `year` desc, `createdAt` desc |
| `cotisationMontant` | Montant de cette cotisation | idem |
| `cotisationStatut` | Statut de cette cotisation | idem |
| `placeNom` | Nom du 1er commerce lié (vide si aucun) | `places[0].place.name` |
| `placeAdresse` | Adresse du 1er commerce : `"${streetNumber} ${street}, ${postalCode} ${city}"` | `places[0].place` |

- **"Cotisation la plus récente"** : tri par `year` DESC, puis `createdAt` DESC. Vide si aucun paiement.
- **Fichier XLSX** : en-têtes en gras (row 1), colonnes auto-dimensionnées, nom `membres-abc-YYYY-MM-DD.xlsx`
- **Fichier CSV** : encodage UTF-8 avec BOM (compatible Excel Windows), séparateur `;`, nom `membres-abc-YYYY-MM-DD.csv`

### Import

- **Déclencheur** : bouton "Importer" dans la barre d'actions → modal d'upload
- **Formats acceptés** : `.csv` et `.xlsx`
- **Limites** : taille maximale 5 Mo, 5 000 lignes maximum
- **Feuille XLSX** : toujours la première feuille
- **Encodage CSV** : UTF-8 (avec ou sans BOM), séparateur `;` ou `,` (auto-détecté)

**Colonne `action`** obligatoire dans le fichier :
- `create` — crée un `AbcMember` pour le `User` identifié par email
- `update` — met à jour les champs `AbcMember` du membre identifié par email
- `skip` — ligne ignorée silencieusement

**Colonnes obligatoires** : `action`, `email`. Absence de l'une ou l'autre → import bloqué entièrement avec message d'erreur avant tout traitement.

**Champs mis à jour lors d'`update`** : `numero`, `type`, `role`, `statut`, `dateAdhesion`, `dateExpiration`. Les champs `nom`, `prenom`, `telephone` sont ignorés à l'import.

**Comportement** :
- Validation structurelle (colonnes requises présentes, limites de taille) avant toute écriture → erreur bloquante si invalide
- Traitement ligne par ligne : les erreurs par ligne n'interrompent pas les autres
- Fichier vide (0 lignes de données) → rapport : 0 créés, 0 mis à jour, 0 ignorés, 0 erreurs

**Rapport post-import** affiché dans la modal :
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

Nouveau enum **`AbcMemberPlaceRole`** :

```prisma
enum AbcMemberPlaceRole {
  GERANT
  ASSOCIE
  SALARIE
  AUTRE
}
```

Nouveau modèle **`AbcMemberPlace`** (table de liaison) :

```prisma
model AbcMemberPlace {
  id        String              @id @default(cuid())
  memberId  String
  placeId   String
  role      AbcMemberPlaceRole  @default(GERANT)
  member    AbcMember           @relation(fields: [memberId], references: [id], onDelete: Cascade)
  place     Place               @relation(fields: [placeId], references: [id], onDelete: Cascade)
  createdAt DateTime            @default(now())

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
  - Liste des places liées : nom du commerce + badge rôle + bouton modifier le rôle + bouton supprimer le lien
  - Bouton "Ajouter un commerce" → searchable combobox sur les `Place` existantes + select rôle (GÉRANT / ASSOCIÉ / SALARIÉ / AUTRE)
  - Chaque action (ajout, modification rôle, suppression) déclenche immédiatement l'API correspondante

### UI — Tableau membres admin

- Nouvelle colonne **"Commerce(s)"** dans le tableau de `/dashboard/admin/abc/members`
- Affiche : nom de la 1ère place liée
- Si plusieurs places : nom + badge "+N"
- Si aucune place : cellule vide

### UI — Page places admin

- Section **"Membres ABC"** ajoutée en lecture seule dans la liste/fiche places admin (selon ce qui existe)
- Affiche : nom du membre + badge rôle, pour chaque lien

### API

```
GET    /api/admin/abc/members/[memberId]/places             — liste des places d'un membre
POST   /api/admin/abc/members/[memberId]/places             — ajouter un lien {placeId, role}
PATCH  /api/admin/abc/members/[memberId]/places/[placeId]   — modifier le rôle {role}
DELETE /api/admin/abc/members/[memberId]/places/[placeId]   — supprimer un lien
GET    /api/admin/abc/places/[placeId]/members              — membres liés à une place
```

---

## Contraintes techniques

- Next.js 15 App Router — les nouvelles pages/composants suivent les patterns existants
- Prisma ORM — `db:push` (projet n'utilise pas migrate)
- Composants UI : shadcn/ui existants (Dialog, Tabs, Command/Combobox, Badge, Table, Select)
- Nouvelle dépendance : `xlsx` (SheetJS) pour import/export
- Toutes les routes API protégées par vérification de rôle admin/moderateur

---

## Hors périmètre (Phase 2 et 3)

- Appels à cotisation et relances email
- Gestion des présences aux réunions
- Espace membre amélioré
- Actions en masse sur membres
- Tableaux de bord avec graphiques
- Création de comptes `User` lors de l'import (import suppose des Users existants)

---

## Critères d'acceptation

- [ ] La table `abc_member_places` est créée en base sans affecter les données existantes
- [ ] Export CSV inclut toutes les colonnes avec UTF-8 BOM et séparateur `;`
- [ ] Export XLSX s'ouvre correctement dans Excel avec en-têtes en gras
- [ ] Export avec membre ayant une place liée produit `placeNom` et `placeAdresse` corrects
- [ ] Export sans place liée produit des colonnes `placeNom`/`placeAdresse` vides
- [ ] La cotisation exportée est bien la plus récente (tri `year` desc, `createdAt` desc)
- [ ] Import bloqué si colonne `action` ou `email` absente (erreur avant traitement)
- [ ] Import bloqué si fichier > 5 Mo ou > 5 000 lignes
- [ ] Import fichier vide → rapport 0/0/0/0 sans erreur
- [ ] Import `action=create` avec email correspondant à un User sans AbcMember → membre créé
- [ ] Import `action=create` avec email déjà membre → erreur dans rapport, autres lignes traitées
- [ ] Import `action=create` avec email inconnu → erreur dans rapport
- [ ] Import `action=update` met à jour les champs AbcMember du membre existant
- [ ] Import `action=update` avec email inconnu → erreur dans rapport
- [ ] Import `action=skip` ignore la ligne silencieusement
- [ ] Le rapport post-import affiche créés / mis à jour / ignorés / erreurs
- [ ] L'onglet "Commerces" dans edit-member permet d'ajouter un lien avec rôle
- [ ] L'onglet "Commerces" permet de modifier le rôle d'un lien existant
- [ ] L'onglet "Commerces" permet de supprimer un lien
- [ ] La colonne "Commerce(s)" affiche le nom de la 1ère place et badge "+N" si plusieurs
- [ ] La section "Membres ABC" en lecture seule est visible côté places admin
