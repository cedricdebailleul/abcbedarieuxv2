# Guide : Nettoyage automatique des images (Local + Cloudflare R2)

Ce guide explique comment utiliser `cleanupUnusedImages()` et `deleteAllImages()` pour nettoyer automatiquement les images obsolètes lors de la mise à jour ou suppression d'entités.

## Fonctions disponibles

### `cleanupUnusedImages(oldEntity, newFields)`

Compare les anciennes et nouvelles images et supprime automatiquement celles qui ne sont plus utilisées (local + R2).

### `deleteAllImages(entity)`

Supprime toutes les images d'une entité (utilisé lors de la suppression complète).

---

## 🔧 Pour une route PUT (Mise à jour)

### Exemple avec Place (déjà implémenté)

```typescript
import { cleanupUnusedImages } from "@/lib/cleanup-images";

export async function PUT(request: Request, ctx: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await ctx.params;

  // 1. Récupérer l'entité existante
  const existingPlace = await prisma.place.findUnique({
    where: { id: placeId },
  });

  // 2. Parser et valider les nouvelles données
  const body = await request.json();
  const validatedData = placeSchema.parse(body);

  // ... logique de traitement des images ...
  const finalLogo = /* ... */;
  const finalCover = /* ... */;
  const normalizedPhotos = /* ... */;

  // 3. Nettoyer les images obsolètes AVANT la mise à jour
  await cleanupUnusedImages(existingPlace, {
    logo: finalLogo ?? null,
    coverImage: finalCover ?? null,
    images: normalizedPhotos,
  });

  // 4. Mettre à jour l'entité
  const place = await prisma.place.update({
    where: { id: placeId },
    data: {
      logo: finalLogo,
      coverImage: finalCover,
      images: normalizedPhotos,
      // ... autres champs
    },
  });

  return NextResponse.json({ place });
}
```

### Exemple avec Event

```typescript
import { cleanupUnusedImages } from "@/lib/cleanup-images";

export async function PUT(request: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params;

  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });

  const body = await request.json();
  const { logo, images, ...eventData } = body;

  // Nettoyer les images obsolètes
  await cleanupUnusedImages(existingEvent, {
    logo: logo ?? null,
    images: images ?? [],
  });

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      logo,
      images,
      ...eventData,
    },
  });

  return NextResponse.json({ event });
}
```

### Exemple avec Post

```typescript
import { cleanupUnusedImages } from "@/lib/cleanup-images";

export async function PUT(request: Request, ctx: { params: Promise<{ postId: string }> }) {
  const { postId } = await ctx.params;

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  const body = await request.json();
  const { coverImage, ...postData } = body;

  // Nettoyer les images obsolètes
  await cleanupUnusedImages(existingPost, {
    coverImage: coverImage ?? null,
  });

  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      coverImage,
      ...postData,
    },
  });

  return NextResponse.json({ post });
}
```

---

## 🗑️ Pour une route DELETE (Suppression complète)

### Exemple avec Place (déjà implémenté)

```typescript
import { deleteAllImages } from "@/lib/cleanup-images";
import { rm } from "node:fs/promises";

export async function DELETE(request: Request, ctx: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await ctx.params;

  const existingPlace = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (!existingPlace) {
    return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
  }

  // Supprimer toutes les images (local + R2)
  await deleteAllImages(existingPlace);

  // Supprimer le dossier local (optionnel si déjà vide)
  try {
    const uploadDir = `/uploads/places/${existingPlace.slug}`;
    await rm(uploadDir, { recursive: true, force: true });
  } catch {}

  // Supprimer l'entrée en base
  await prisma.place.delete({ where: { id: placeId } });

  return NextResponse.json({ success: true });
}
```

### Exemple avec Event

```typescript
import { deleteAllImages } from "@/lib/cleanup-images";

export async function DELETE(request: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params;

  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!existingEvent) {
    return NextResponse.json({ error: "Event non trouvé" }, { status: 404 });
  }

  // Supprimer toutes les images
  await deleteAllImages(existingEvent);

  // Supprimer l'event
  await prisma.event.delete({ where: { id: eventId } });

  return NextResponse.json({ success: true });
}
```

---

## 📋 Champs d'images supportés

La fonction `cleanupUnusedImages()` détecte automatiquement ces champs :

- `logo` (string | null)
- `coverImage` (string | null)
- `images` (JSON field - string[])
- `gallery` (string[] - utilisé par Event)

Si votre modèle a d'autres champs, ajoutez-les dans `lib/cleanup-images.ts`.

---

## ✅ Avantages

1. **Automatique** : Détecte et supprime les images obsolètes sans intervention manuelle
2. **Sécurisé** : Compare old vs new pour éviter de supprimer les images encore utilisées
3. **Multi-stockage** : Supprime à la fois local ET Cloudflare R2
4. **Tolérant aux erreurs** : Continue même si une suppression échoue
5. **Logs clairs** : Affiche les suppressions dans la console

---

## 🔍 Logs de debugging

Vous verrez ces logs dans votre console :

```
🧹 Nettoyage de 3 image(s) obsolète(s)...
  ✅ places/old-slug/logo_123.jpg
  ✅ places/old-slug/gallery/photo1.jpg
  ⚠️  places/old-slug/gallery/photo2.jpg: File not found
🗑️  2/3 image(s) supprimée(s)
```

---

## 🚀 TODO : Implémenter dans vos autres routes

- [x] Place (PUT + DELETE) - ✅ Implémenté
- [ ] Event (PUT + DELETE)
- [ ] Post (PUT + DELETE)
- [ ] Partner (PUT + DELETE)
- [ ] Newsletter (attachments)
- [ ] Profile (avatar, cover)

Pour chaque route, il suffit d'ajouter :

1. **PUT** : `await cleanupUnusedImages(existing, newFields)` avant l'update
2. **DELETE** : `await deleteAllImages(existing)` avant le delete
