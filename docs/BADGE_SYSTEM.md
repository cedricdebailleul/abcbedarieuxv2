# 🎖️ Système de Badges - Documentation

Ce document explique le fonctionnement du système de badges automatique et comment implémenter de nouveaux badges.

## 📋 Vue d'ensemble

Le système de badges récompense automatiquement les utilisateurs pour leurs actions sur la plateforme. Il comprend :

- **Attribution automatique** lors d'événements spécifiques
- **Popup de célébration** avec animations spectaculaires
- **Gestion des raretés** (Common, Uncommon, Rare, Epic, Legendary)
- **Persistance en base** avec historique des attributions

## 🏗️ Architecture

### Fichiers principaux

```
lib/
├── badge-system.ts              # Logique métier des badges
├── generated/prisma/            # Types Prisma (Badge, UserBadge, etc.)

components/
├── ui/badge-celebration.tsx     # Popup de célébration avec animations
├── providers/badge-provider.tsx # Provider global pour la popup

hooks/
├── use-badge-celebration.ts     # Hook Zustand pour gérer l'état

actions/
├── post.ts                      # Intégration dans createPostAction

scripts/
├── create-article-badges.ts     # Script de création des badges d'articles
├── debug-badges.ts              # Outils de debug
```

### Schéma de base de données

```prisma
model Badge {
  id          String        @id @default(cuid())
  title       String        @unique
  description String
  category    BadgeCategory
  rarity      BadgeRarity
  color       String?       // Couleur hexadecimale
  iconUrl     String?       // URL d'image ou emoji
  isActive    Boolean       @default(true)
  users       UserBadge[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeId   String
  reason    String   // Raison de l'attribution
  isVisible Boolean  @default(true)
  earnedAt  DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge     Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  
  @@unique([userId, badgeId])
}

enum BadgeCategory {
  ACHIEVEMENT  // Accomplissements
  COMMUNITY    // Participation communautaire
  SPECIAL      // Événements spéciaux
  TIME         // Badges temporels
}

enum BadgeRarity {
  COMMON       // Gris
  UNCOMMON     // Vert
  RARE         // Bleu
  EPIC         // Violet
  LEGENDARY    // Doré
}
```

## 🚀 Badges existants

### Articles
- **Premier article** (Common) - Premier article publié
- **Auteur régulier** (Uncommon) - 5 articles publiés
- **Rédacteur prolifique** (Rare) - 10 articles publiés
- **Maître écrivain** (Epic) - 25 articles publiés

### Autres catégories
- **Bienvenue** (Common) - Inscription
- **Profil complété** (Uncommon) - Profil entièrement renseigné
- **Premier lieu** (Uncommon) - Première place ajoutée
- **Pionnier** (Legendary) - 100 premiers membres

## ⚙️ Fonctionnement technique

### 1. Attribution automatique

La classe `BadgeSystem` gère l'attribution :

```typescript
export class BadgeSystem {
  // Attribution lors de la création d'articles
  static async onPostCreated(userId: string) {
    const postCount = await prisma.post.count({
      where: { authorId: userId },
    });
    
    const newBadges = [];
    
    if (postCount === 1) {
      const awarded = await BadgeSystem.awardBadge(
        userId, 
        "Premier article", 
        "Premier article publié"
      );
      if (awarded) {
        newBadges.push({ badge: awarded, reason: "Premier article publié" });
      }
    }
    // ... autres seuils
    
    return newBadges;
  }
}
```

### 2. Intégration dans les actions

Les server actions appellent le système de badges :

```typescript
export async function createPostAction(input: CreatePostInput) {
  // ... création de l'article
  
  // Attribution automatique des badges
  const newBadges = await BadgeSystem.onPostCreated(user.id);
  
  return {
    success: true,
    data: {
      id: post.id,
      slug: post.slug,
      newBadges, // 👈 Retourné au frontend
    },
  };
}
```

### 3. Affichage de la popup

Le frontend utilise le hook `useBadgeCelebration` :

```typescript
const { showBadge } = useBadgeCelebration();

const onSubmit = async (data) => {
  const result = await createPostAction(data);
  
  if (result.success && result.data?.newBadges?.length > 0) {
    setTimeout(() => {
      result.data.newBadges.forEach((badgeData) => {
        showBadge(badgeData.badge, badgeData.reason);
      });
    }, 1000);
  }
};
```

## 🆕 Ajouter de nouveaux badges

### Étape 1 : Créer les badges en base

Créez un script dans `scripts/` :

```typescript
// scripts/create-my-new-badges.ts
import { prisma } from "@/lib/prisma";
import { BadgeCategory, BadgeRarity } from "@/lib/generated/prisma";

const newBadges = [
  {
    title: "Commentateur actif",
    description: "Vous avez laissé 10 commentaires",
    category: BadgeCategory.COMMUNITY,
    rarity: BadgeRarity.UNCOMMON,
    color: "#10B981",
    iconUrl: "💬", // Emoji ou URL
  },
  // ... autres badges
];

async function createNewBadges() {
  for (const badge of newBadges) {
    const existing = await prisma.badge.findFirst({
      where: { title: badge.title },
    });

    if (!existing) {
      await prisma.badge.create({ data: badge });
      console.log(`✅ Badge "${badge.title}" créé`);
    }
  }
}

createNewBadges()
  .finally(() => prisma.$disconnect());
```

Exécutez le script :
```bash
pnpm exec tsx scripts/create-my-new-badges.ts
```

### Étape 2 : Implémenter la logique d'attribution

Ajoutez une méthode dans `BadgeSystem` :

```typescript
// lib/badge-system.ts
export class BadgeSystem {
  // Nouvelle méthode pour les commentaires
  static async onCommentCreated(userId: string) {
    const commentCount = await prisma.comment.count({
      where: { authorId: userId },
    });
    
    const newBadges = [];
    
    if (commentCount === 10) {
      const awarded = await BadgeSystem.awardBadge(
        userId,
        "Commentateur actif",
        "10 commentaires laissés"
      );
      if (awarded) {
        newBadges.push({ badge: awarded, reason: "10 commentaires laissés" });
      }
    }
    
    return newBadges;
  }
}
```

### Étape 3 : Intégrer dans les actions

Modifiez les server actions concernées :

```typescript
// actions/comment.ts
export async function createCommentAction(input: CommentInput) {
  // ... création du commentaire
  
  // Attribution automatique des badges
  const newBadges = await BadgeSystem.onCommentCreated(user.id);
  
  return {
    success: true,
    data: { 
      id: comment.id,
      newBadges,
    },
  };
}
```

### Étape 4 : Déclencher la popup

Dans le composant frontend :

```typescript
const { showBadge } = useBadgeCelebration();

const onSubmit = async (data) => {
  const result = await createCommentAction(data);
  
  if (result.success && result.data?.newBadges?.length > 0) {
    setTimeout(() => {
      result.data.newBadges.forEach((badgeData) => {
        showBadge(badgeData.badge, badgeData.reason);
      });
    }, 1000);
  }
};
```

## 🎨 Personnalisation des badges

### Couleurs par rareté

```typescript
const rarityColors = {
  COMMON: "#6B7280",    // Gris
  UNCOMMON: "#10B981",  // Vert
  RARE: "#3B82F6",      // Bleu
  EPIC: "#8B5CF6",      // Violet
  LEGENDARY: "#F59E0B", // Doré
};
```

### Icônes

Vous pouvez utiliser :
- **Emojis** : `"🏆"`, `"📝"`, `"💬"`
- **URLs d'images** : `"/images/badges/special.png"`
- **Icônes Lucide** : Le composant utilise des icônes par défaut selon la rareté

### Animations

Le composant `BadgeCelebration` inclut :
- ✨ **Feux d'artifice** colorés
- 🌟 **Étoiles scintillantes**
- 🎭 **Animations de scale et rotation**
- 🌈 **Gradients selon la rareté**

## 🔧 Outils de debug

### Script de debug général
```bash
pnpm exec tsx scripts/debug-badges.ts
```

### Attribuer un badge manuellement
```typescript
await BadgeSystem.awardBadge(
  userId,
  "Nom du badge",
  "Raison de l'attribution"
);
```

### Vérifier les badges d'un utilisateur
```typescript
const userBadges = await prisma.userBadge.findMany({
  where: { userId },
  include: { badge: true },
});
```

## 📝 Bonnes pratiques

### 1. **Nommage des badges**
- Utilisez des noms descriptifs et motivants
- Évitez les acronymes ou abréviations

### 2. **Seuils progressifs**
- Créez des jalons logiques (1, 5, 10, 25, 50, 100)
- Augmentez la rareté avec les seuils

### 3. **Raisons claires**
- Expliquez pourquoi le badge a été obtenu
- Utilisez un langage encourageant

### 4. **Performance**
- Les requêtes de comptage sont cached
- Évitez les calculs complexes dans les événements fréquents

### 5. **Test et validation**
- Testez l'attribution avec des données de test
- Vérifiez que les badges ne peuvent pas être obtenus plusieurs fois

## 🚨 Limitations

- **Un badge par utilisateur** : Impossible d'obtenir le même badge plusieurs fois
- **Attribution immédiate** : Pas de badges rétroactifs automatiques
- **Cache des badges** : Redémarrer l'app pour vider le cache après modifications

## 💡 Idées de nouveaux badges

### Engagement communautaire
- **Social** : Profil avec tous les réseaux sociaux
- **Mentor** : Aider d'autres utilisateurs
- **Fidèle** : Connexion quotidienne pendant X jours

### Contenu
- **Viral** : Article avec beaucoup de vues
- **Populaire** : Article le plus liké du mois
- **Polyvalent** : Articles dans 5 catégories différentes

### Participation
- **Critique** : X avis laissés
- **Explorateur** : X lieux visités
- **Photographe** : X photos uploadées

### Temporels
- **Anniversaire** : 1 an sur la plateforme
- **Pionnier** : Parmi les premiers utilisateurs
- **Saisonnier** : Actions pendant les fêtes

---

**Note** : Ce système est conçu pour être extensible. N'hésitez pas à ajouter de nouvelles catégories et mécaniques selon les besoins de votre plateforme ! 🚀