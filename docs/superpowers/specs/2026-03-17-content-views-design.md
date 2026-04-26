# Spec — Statistiques de visite Produits / Services / Offres

**Date:** 2026-03-17
**Statut:** Approuvé

---

## Contexte

Les fiches Place disposent déjà d'un tracking riche via la table `PlaceView` (IP, géolocalisation, referer, déduplication 10 min, time-series). Les modèles `Product`, `Service` et `Offer` n'ont qu'un champ `viewCount` (compteur brut) sans historique ni détail.

L'objectif est d'apporter le même niveau de tracking aux produits, services et offres, avec deux surfaces d'affichage : le dashboard gérant et l'admin analytics.

---

## 1. Schéma (Prisma)

### Nouveau modèle `ContentView`

```prisma
enum ContentViewType {
  PRODUCT
  SERVICE
  OFFER
}

model ContentView {
  id          String          @id @default(cuid())
  contentType ContentViewType
  contentId   String
  placeId     String
  ipAddress   String          @default("")
  userAgent   String          @default("")
  referer     String          @default("")
  country     String          @default("")
  region      String          @default("")
  city        String          @default("")
  createdAt   DateTime        @default(now())

  place       Place           @relation(fields: [placeId], references: [id], onDelete: Cascade)

  @@index([contentType, contentId, ipAddress])
  @@index([placeId])
  @@index([createdAt])
  @@map("content_views")
}
```

**Notes de schéma :**
- Les champs de tracking (`ipAddress`, `userAgent`, `referer`, `country`, `region`, `city`) utilisent `@default("")` pour correspondre exactement au pattern `PlaceView` existant. La déduplication utilise une guard `if (ipAddress)` (chaîne non vide).
- Pas de `updatedAt` — `ContentView` est une table append-only (lecture seule après insertion). C'est intentionnel.
- L'index composite `[contentType, contentId, ipAddress]` couvre la requête de déduplication (chemin chaud).
- Pas de relation directe vers `Product`/`Service`/`Offer` — les requêtes se font par `contentType + contentId`. Prisma ne supporte pas les relations polymorphes nativement.

### Modifications aux modèles existants

- `Place` : ajouter `contentViews ContentView[]`
- `Product`, `Service`, `Offer` : le champ `viewCount` existant reste — il est mis à jour en même temps que l'insertion dans `ContentView` (source de vérité = `ContentView`, `viewCount` = cache dénormalisé)

### Déduplication

Même logique que `PlaceView` : skip si une `ContentView` existe avec le même `contentId`, `contentType` et `ipAddress` (non vide) dans les 10 dernières minutes.

---

## 2. API Endpoints

### Tracking public

**`POST /api/places/[placeSlug]/content-view`**

> ⚠️ Le segment `[placeSlug]` est un **slug** (comme dans `view/route.ts` existant), pas un `id` cuid. Le handler résout le slug vers l'`id` via `prisma.place.findUnique({ where: { slug } })`.

- Body : `{ contentType: "PRODUCT" | "SERVICE" | "OFFER", contentId: string }`
- Authentification : aucune (public)
- Validation entrée : `contentType` doit être dans l'enum, `contentId` doit être une string non vide — `400` sinon
- Déduplication : 10 min par IP + contentId + contentType
- Actions : insère dans `ContentView` + incrémente `viewCount` sur le modèle cible
- Réponses :
  - `200 OK` — vue enregistrée
  - `200 OK` — dédupliquée, ignorée silencieusement
  - `400 Bad Request` — body invalide
  - `404 Not Found` — fiche inexistante

### Stats gérant

**`GET /api/user/places/[placeSlug]/content-stats`**

- Authentification : session requise — `401` si non connecté
- Vérification ownership : `place.ownerId === session.user.id` (champ `ownerId` sur le modèle `Place`) — `403` si authentifié mais non propriétaire
- Query params : `period` (7d | 30d | 12m, défaut 30d), `type` (PRODUCT | SERVICE | OFFER, optionnel — tous si absent)
- Réponse :
  ```json
  {
    "summary": { "PRODUCT": 284, "SERVICE": 156, "OFFER": 93 },
    "items": [
      { "contentType": "PRODUCT", "contentId": "...", "name": "Pain au levain", "views": 142 },
      ...
    ]
  }
  ```
- `items` triés par nombre de vues décroissant, limité à 20 par type
- `name` est résolu en faisant un `findMany` sur les modèles Product/Service/Offer avec les `contentId` récupérés

### Stats admin

Extension de l'endpoint existant **`GET /api/analytics/admin`** (`app/api/analytics/admin/route.ts`) :

- Le type `Tab` et le tableau `validTabs` doivent être mis à jour pour inclure : `"products" | "services" | "offers"`
- Réponse pour ces nouveaux tabs (même structure que `places`) :
  ```json
  {
    "totalViews": 533,
    "uniqueViewers": 210,
    "timeSeries": [{ "date": "2026-03-01", "count": 42 }, ...],
    "topItems": [
      { "id": "...", "name": "Pain au levain", "placeName": "Boulangerie Dupont", "views": 142 },
      ...
    ]
  }
  ```
- `topItems` : top 10, avec `placeName` résolu via join sur `Place`

---

## 3. UI

### Page stats gérant

**Route :** `/dashboard/places/[placeSlug]/stats`

Composants :
- Sélecteur de période : 7j / 30j / 12m (state local)
- 3 cartes résumé colorées : total vues Produits (bleu) / Services (vert) / Offres (jaune) sur la période
- Onglets Produits / Services / Offres
- Par onglet : tableau classé par vues décroissant, barre de progression relative au top item

Accès : bouton ou lien "Statistiques" dans la page de gestion de la fiche place (dashboard propriétaire).

### Admin analytics

Dans la page admin analytics existante (`/dashboard/admin/analytics`) :

- L'onglet "Places" reçoit des **sous-onglets** : Fiches / Produits / Services / Offres
- "Fiches" = comportement actuel inchangé
- "Produits", "Services", "Offres" = top 10 items sur la période, avec colonnes : Nom, Fiche, Vues

---

## 4. Intégration du tracking côté frontend

Le tracking est déclenché côté client lors de la consultation d'un produit, service ou offre sur la fiche publique.

- Appel `POST /api/places/[placeSlug]/content-view` après le premier rendu de la page/modal produit
- Similaire au pattern existant `POST /api/places/[placeSlug]/view` (note : l'existant utilise `[placeId]` comme nom de segment mais résout par slug — même convention ici)
- Pas de retry en cas d'erreur — le tracking est best-effort

---

## 5. Critères d'acceptation

| # | Critère |
|---|---------|
| 1 | La table `content_views` est créée en base via `db:push` |
| 2 | Une vue produit/service/offre est enregistrée une seule fois par IP sur 10 min |
| 3 | Le `viewCount` du modèle cible est incrémenté à chaque vue non-dédupliquée |
| 4 | Le gérant voit la page stats avec résumé + top items par type |
| 5 | L'admin voit les sous-onglets Produits/Services/Offres dans l'analytics Places |
| 6 | Les stats sont filtrables par période (7j / 30j / 12m) |
| 7 | Aucune regression sur les analytics places existants |
| 8 | Body invalide sur l'endpoint de tracking retourne `400` |
| 9 | Requête non authentifiée sur `/content-stats` retourne `401` |
| 10 | Utilisateur authentifié non propriétaire sur `/content-stats` retourne `403` |

---

## 6. Hors périmètre

- Géolocalisation IP (présente dans le schéma mais non remplie pour l'instant — même comportement que PlaceView)
- Graphique time-series dans la vue gérant (onglet simple suffit pour V1)
- Notifications ou alertes sur les pics de vues
- Export CSV des stats produits/services
