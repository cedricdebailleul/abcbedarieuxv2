# Presence Type (Commerces sans adresse physique) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permettre la création de fiches pour commerces en ligne ou itinérants (sans rue), qui apparaissent quand même sur la carte au centre de Bédarieux avec un message explicatif.

**Architecture:** Ajout d'un enum `PresenceType` (PHYSICAL / ONLINE / MOBILE) dans Prisma, `street` devient optionnel, le formulaire adapte sa validation conditionnellement, la fiche publique affiche un badge et un pin Bédarieux pour les fiches sans adresse physique.

**Tech Stack:** Prisma ORM, Next.js 15 App Router, React Hook Form + Zod, Google Maps API

**Bédarieux centre:** lat `43.6222`, lng `3.1519`

---

## Task 1 : Créer la branche Git

**Files:** aucun

**Step 1 : Créer et basculer sur la branche**

```bash
git checkout -b feature/presence-type-no-address
```

Expected: `Switched to a new branch 'feature/presence-type-no-address'`

---

## Task 2 : Modifier le schéma Prisma

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1 : Ajouter l'enum PresenceType avant les autres enums**

Trouver le bloc `enum PlaceType {` (ligne ~1090) et ajouter AVANT lui :

```prisma
enum PresenceType {
  PHYSICAL // Établissement physique avec adresse
  ONLINE   // Commerce en ligne (sans local)
  MOBILE   // Itinérant / à domicile
}
```

**Step 2 : Modifier le modèle Place**

Trouver le bloc `// Localisation (requis pour Google Places)` (ligne ~466) et remplacer :

```prisma
  // Localisation
  presenceType PresenceType @default(PHYSICAL)
  street       String?
  streetNumber String?
  postalCode   String
  city         String
  latitude     Float?
  longitude    Float?
```

(avant : `street String` était non-nullable)

**Step 3 : Appliquer la migration**

```bash
pnpm db:push
```

Expected : Prisma affiche les changements détectés (ajout colonne `presenceType`, modification nullable `street`) et demande confirmation. Répondre `y`.

> ⚠️ En prod, utiliser `pnpm db:migrate` avec un nom de migration explicite.

**Step 4 : Régénérer le client Prisma**

```bash
pnpm db:generate
```

Expected : `Generated Prisma Client (v...)` sans erreur.

**Step 5 : Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add PresenceType enum, make street optional"
```

---

## Task 3 : Mettre à jour l'API de création (`/api/places`)

**Files:**
- Modify: `app/api/places/route.ts`

**Step 1 : Ajouter `presenceType` à `PlaceIncoming`**

Dans l'interface `PlaceIncoming` (ligne ~22), ajouter dans le bloc des champs existants :

```ts
  presenceType?: "PHYSICAL" | "ONLINE" | "MOBILE";
```

**Step 2 : Normaliser `presenceType` après la section géolocalisation (~ligne 470)**

Après la ligne `const city = asString(body.city ?? ...)`, ajouter :

```ts
// Type de présence
const BEDARIEUX_LAT = 43.6222;
const BEDARIEUX_LNG = 3.1519;

const validPresenceTypes = ["PHYSICAL", "ONLINE", "MOBILE"] as const;
type PresenceTypeValue = typeof validPresenceTypes[number];
const rawPresence = asString(body.presenceType ?? "PHYSICAL").toUpperCase();
const presenceType: PresenceTypeValue = validPresenceTypes.includes(rawPresence as PresenceTypeValue)
  ? (rawPresence as PresenceTypeValue)
  : "PHYSICAL";

// Fallback coords Bédarieux pour les fiches sans adresse physique
const resolvedLatitude = latitude ?? (presenceType !== "PHYSICAL" ? BEDARIEUX_LAT : null);
const resolvedLongitude = longitude ?? (presenceType !== "PHYSICAL" ? BEDARIEUX_LNG : null);
```

**Step 3 : Retirer `street` de la liste des champs obligatoires**

Trouver le bloc `const missing = ["name", "slug", "type", "street", "postalCode", "city"]` (~ligne 496).

Remplacer par :

```ts
// street requis seulement pour établissement physique
const requiredFields = ["name", "slug", "type", "postalCode", "city"];
if (presenceType === "PHYSICAL") requiredFields.push("street");

const missing = requiredFields.filter((k) => {
  const map: Record<string, string> = {
    name,
    slug,
    type: rawType,
    street,
    postalCode,
    city,
  };
  return !String(map[k] || "").trim();
});
```

**Step 4 : Ajouter `presenceType` et `resolvedLatitude/Longitude` au `prisma.place.create`**

Dans le bloc `data: {` (~ligne 568), ajouter après `city,` :

```ts
presenceType,
latitude: resolvedLatitude,
longitude: resolvedLongitude,
```

Et remplacer les lignes `latitude,` et `longitude,` existantes (elles utilisaient maintenant `resolvedLatitude/Longitude`).

**Step 5 : Vérifier qu'il n'y a pas d'erreur TypeScript**

```bash
pnpm type-check
```

Expected : aucune erreur dans `app/api/places/route.ts`

**Step 6 : Commit**

```bash
git add app/api/places/route.ts
git commit -m "feat(api): support presenceType, make street optional for non-physical places"
```

---

## Task 4 : Mettre à jour le formulaire (`place-form.tsx`)

**Files:**
- Modify: `components/forms/place-form.tsx`

**Step 1 : Ajouter `presenceType` au schéma Zod**

Dans `placeSchema` (ligne ~141), remplacer :

```ts
  // Adresse
  street: z.string().min(1, "La rue est requise"),
  streetNumber: z.string().optional(),
  postalCode: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),
```

Par :

```ts
  // Présence
  presenceType: z.enum(["PHYSICAL", "ONLINE", "MOBILE"]).default("PHYSICAL"),

  // Adresse (rue requise uniquement pour établissement physique)
  street: z.string().optional(),
  streetNumber: z.string().optional(),
  postalCode: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),
```

Puis après le bloc `placeSchema`, ajouter un `.superRefine` :

```ts
const placeSchemaWithRefine = placeSchema.superRefine((data, ctx) => {
  if (data.presenceType === "PHYSICAL" && !data.street?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La rue est requise pour un établissement physique",
      path: ["street"],
    });
  }
});
```

Et remplacer l'usage de `placeSchema` dans `useForm` par `placeSchemaWithRefine` :

```ts
const form = useForm<PlaceFormData>({
  resolver: zodResolver(placeSchemaWithRefine) as Resolver<PlaceFormData, unknown>,
```

**Step 2 : Ajouter `presenceType` aux `defaultValues`**

Dans `defaultValues` (~ligne 254), ajouter :

```ts
presenceType: "PHYSICAL",
```

Et dans `initialData` loading block, ajouter :

```ts
presenceType: initialData.presenceType || "PHYSICAL",
```

**Step 3 : Ajouter `presenceType` au `useWatch`**

Après les lignes `const streetW = useWatch(...)` (~ligne 288), ajouter :

```ts
const presenceTypeW = useWatch({ control: form.control, name: "presenceType" });
const isPhysical = presenceTypeW === "PHYSICAL";
```

**Step 4 : Modifier le géocodage automatique pour respecter presenceType**

Dans le `useEffect` du géocodage auto (~ligne 489), wrapper la condition :

```ts
if (haveCoords) return;
if (isPhysical && streetW && cityW && postalCodeW) {
  // ... géocode existant
}
```

**Step 5 : Ajouter le sélecteur de présence dans le JSX**

Dans la section "Localisation" du formulaire (chercher `<CardHeader>` contenant `MapPin`), ajouter **avant** le bloc `grid grid-cols-1 md:grid-cols-4` des champs adresse :

```tsx
{/* Type de présence */}
<FormField
  control={form.control}
  name="presenceType"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Type de présence *</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Choisir..." />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="PHYSICAL">Établissement physique (avec adresse)</SelectItem>
          <SelectItem value="ONLINE">Commerce en ligne (sans local)</SelectItem>
          <SelectItem value="MOBILE">Itinérant / à domicile</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Step 6 : Conditionner l'affichage du champ "Rue"**

Trouver le `FormField` du champ `street` (~ligne 986) et wrapper le `<div className="grid grid-cols-1 md:grid-cols-4 gap-4">` contenant `streetNumber` et `street` avec :

```tsx
{isPhysical && (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* ... streetNumber et street existants ... */}
  </div>
)}
{!isPhysical && (
  <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
    {presenceTypeW === "ONLINE"
      ? "Commerce en ligne — aucune adresse de rue nécessaire. Le code postal et la ville situent l'activité."
      : "Activité itinérante — aucune adresse de rue nécessaire. Le code postal et la ville situent la zone d'intervention."}
  </div>
)}
```

**Step 7 : Vérifier qu'il n'y a pas d'erreur TypeScript**

```bash
pnpm type-check
```

Expected : aucune erreur dans `components/forms/place-form.tsx`

**Step 8 : Commit**

```bash
git add components/forms/place-form.tsx
git commit -m "feat(form): add presenceType selector, make street conditional"
```

---

## Task 5 : Mettre à jour la fiche publique (`/places/[slug]/page.tsx`)

**Files:**
- Modify: `app/(front)/places/[slug]/page.tsx`

**Step 1 : Adapter `fullAddress` selon le type de présence**

Trouver le bloc (~ligne 366) :

```ts
const fullAddress = `${place.street} ${place.streetNumber || ""}, ${
  place.postalCode
} ${place.city}`.trim();
```

Remplacer par :

```ts
const BEDARIEUX_LAT = 43.6222;
const BEDARIEUX_LNG = 3.1519;

const isPhysicalPlace = !place.presenceType || place.presenceType === "PHYSICAL";

const fullAddress = isPhysicalPlace
  ? `${place.street || ""} ${place.streetNumber || ""}, ${place.postalCode} ${place.city}`.trim().replace(/^,\s*/, "")
  : place.presenceType === "ONLINE"
  ? `Commerce en ligne — ${place.city}`
  : `Intervient à domicile — ${place.city} et environs`;

// Coordonnées pour la carte : fallback Bédarieux si pas de coords
const mapLat = place.latitude ?? BEDARIEUX_LAT;
const mapLng = place.longitude ?? BEDARIEUX_LNG;
const mapAddress = isPhysicalPlace
  ? fullAddress
  : place.presenceType === "ONLINE"
  ? "Commerce en ligne"
  : "Activité itinérante — intervient à domicile";
```

**Step 2 : Adapter le lien Google Maps**

Trouver `directionsHref` (~ligne 370), remplacer par :

```ts
const directionsHref = isPhysicalPlace && place.latitude && place.longitude
  ? `https://www.google.com/maps?daddr=${place.latitude},${place.longitude}`
  : isPhysicalPlace
  ? `https://www.google.com/maps?daddr=${encodeURIComponent(fullAddress)}`
  : `https://www.google.com/maps?q=Bédarieux+34600`;
```

**Step 3 : Ajouter un badge de présence sous le nom**

Trouver l'endroit où s'affiche le nom de la place (chercher `place.name` dans le JSX), ajouter après les badges existants :

```tsx
{place.presenceType === "ONLINE" && (
  <Badge variant="secondary" className="gap-1">
    <Globe className="w-3 h-3" />
    Commerce en ligne
  </Badge>
)}
{place.presenceType === "MOBILE" && (
  <Badge variant="secondary" className="gap-1">
    <MapPin className="w-3 h-3" />
    Itinérant / à domicile
  </Badge>
)}
```

(`Globe` et `MapPin` sont déjà importés en haut du fichier)

**Step 4 : Adapter l'affichage de la carte**

Trouver le bloc de la carte (~ligne 823) :

```tsx
{place.latitude && place.longitude ? (
  <PlaceDetailMap
    latitude={place.latitude}
    longitude={place.longitude}
    name={place.name}
    address={fullAddress}
  />
) : (
  <div ...>
```

Remplacer par :

```tsx
<PlaceDetailMap
  latitude={mapLat}
  longitude={mapLng}
  name={place.name}
  address={mapAddress}
/>
```

(La carte s'affiche toujours, avec les coords Bédarieux en fallback)

**Step 5 : Vérifier qu'il n'y a pas d'erreur TypeScript**

```bash
pnpm type-check
```

Expected : aucune erreur dans `app/(front)/places/[slug]/page.tsx`

**Step 6 : Commit**

```bash
git add app/(front)/places/[slug]/page.tsx
git commit -m "feat(place-page): adapt address display and map for non-physical places"
```

---

## Task 6 : Test manuel et vérification

**Step 1 : Démarrer le serveur de développement**

```bash
pnpm dev
```

**Step 2 : Créer une fiche "Commerce en ligne"**

- Aller sur `/dashboard/admin/places/new`
- Choisir "Commerce en ligne" dans "Type de présence"
- Vérifier : champ Rue masqué, message bleu affiché
- Remplir : nom, type, code postal (34600), ville (Bédarieux)
- Soumettre → doit fonctionner sans erreur

**Step 3 : Vérifier la fiche créée**

- Aller sur la fiche publique `/places/[slug]`
- Vérifier : badge "Commerce en ligne" visible
- Vérifier : adresse affiche "Commerce en ligne — Bédarieux"
- Vérifier : carte centrée sur Bédarieux avec info window "Commerce en ligne"

**Step 4 : Créer une fiche "Physique" classique**

- Créer une fiche normale avec adresse
- Vérifier : comportement identique à avant, aucune régression

**Step 5 : Vérifier les fiches existantes en base**

- Naviguer sur une fiche existante
- Vérifier : s'affiche normalement (presenceType = PHYSICAL par défaut)

---

## Task 7 : Commit final et push

```bash
git push -u origin feature/presence-type-no-address
```

Puis ouvrir une PR vers `master`.
