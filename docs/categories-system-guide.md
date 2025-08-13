# Guide du Système de Catégories Multiples

## 🎯 Vue d'ensemble

Le système de catégories multiples permet aux places d'être associées à plusieurs catégories, offrant une navigation flexible et une meilleure découvrabilité des établissements.

## 📋 Fonctionnalités Implémentées

### 🗄️ Architecture Base de Données
- **Relation Many-to-Many** via `PlaceToCategory`
- **Hiérarchie** : Catégories principales et sous-catégories
- **Personnalisation visuelle** : Icônes, couleurs, classes Tailwind

### 🎨 Interface Utilisateur
- **MultiSelect** : Sélection multiple avec recherche
- **Badges colorés** : Affichage avec icônes et couleurs
- **Navigation cliquable** : Badges redirigent vers les pages de catégories

### 📄 Pages Publiques
- **Page d'index catégories** : `/categories`
- **Pages par catégorie** : `/categories/{slug}`
- **Pagination** : Gestion des grands volumes
- **Breadcrumbs** : Navigation hiérarchique

## 🚀 Utilisation

### Création de Places avec Catégories
1. **Formulaire place** : Utiliser le MultiSelect pour choisir les catégories
2. **API** : Les relations sont créées automatiquement
3. **Validation** : Schema Zod mis à jour pour tableaux

### Navigation par Catégories
1. **Page d'accueil** : Lien "Catégories d'établissements" dans le header
2. **Page index** : Vue d'ensemble de toutes les catégories
3. **Pages catégories** : Places filtrées par catégorie avec pagination
4. **Badges cliquables** : Navigation directe depuis les cards de places

## 🔧 Scripts Utiles

```bash
# Seeder les catégories de démonstration
pnpm db:seed-place-categories

# Assigner des catégories aux places existantes
npx tsx scripts/test-assign-categories.ts

# Tester le système complet
pnpm test:categories-system

# Tester les pages de catégories
pnpm test:categories-pages
```

## 📊 Structure des Données

### PlaceCategory
```typescript
{
  id: string
  name: string
  slug: string
  description?: string
  icon?: string        // Icône Lucide ou emoji
  color?: string       // Couleur hexadécimale
  bgColor?: string     // Classe Tailwind
  textColor?: string   // Classe Tailwind
  borderColor?: string // Classe Tailwind
  isActive: boolean
  sortOrder: number
  parentId?: string    // Pour hiérarchie
}
```

### PlaceToCategory (Relation)
```typescript
{
  id: string
  placeId: string
  categoryId: string
  createdAt: DateTime
}
```

## 🎨 Composants Clés

### MultiSelect
- **Localisation** : `/components/ui/multi-select.tsx`
- **Usage** : Sélection multiple avec recherche
- **Props** : options, value, onValueChange, placeholder

### PlaceCategoriesBadges
- **Localisation** : `/components/places/place-categories-badges.tsx`
- **Usage** : Affichage des badges de catégories
- **Props** : categories, maxDisplay, size, clickable

## 🌐 URLs Disponibles

- **Index catégories** : `http://localhost:3001/categories`
- **Catégorie spécifique** : `http://localhost:3001/categories/{slug}`
- **Avec pagination** : `http://localhost:3001/categories/{slug}?page=2`

## 📈 Statistiques Actuelles

- **17 catégories** : 6 principales + 11 sous-catégories
- **5 places actives** avec catégories assignées
- **Performance** : Requêtes sous 10ms
- **100% fonctionnel** : Création, affichage, navigation

## 🔍 Exemples de Catégories

### Principales
- 🍽️ **Restaurants** (3 sous-catégories)
- 🏪 **Commerces** (3 sous-catégories)  
- 💼 **Services** (3 sous-catégories)
- 🎭 **Culture & Loisirs** (2 sous-catégories)
- 🏨 **Hébergement**

### Sous-catégories
- 🍕 **Pizzeria** (sous Restaurants)
- ☕ **Café & Bar** (sous Restaurants)
- 🛒 **Alimentaire** (sous Commerces)
- 💄 **Mode & Beauté** (sous Commerces)
- 🏥 **Santé & Bien-être** (sous Services)

## 🐛 Résolution de Problèmes

### Erreur Prisma "Unknown field categories"
```bash
# Régénérer le client Prisma
rm -rf lib/generated/prisma && pnpm db:generate
```

### Performance des Requêtes
- **Index optimisés** : placeId, categoryId
- **Eager loading** : Include categories dans les requêtes
- **Pagination** : Limite de 12 places par page

## 🎯 Prochaines Améliorations

1. **Filtres avancés** : Combiner catégories + localisation
2. **API publique** : Endpoints pour développeurs tiers  
3. **Analytics** : Tracking des catégories populaires
4. **Import/Export** : Gestion en masse des catégories
5. **Cache** : Redis pour les requêtes fréquentes

## 📞 Support

Pour toute question ou problème :
- Consulter les scripts de test dans `/scripts/`
- Vérifier les logs du serveur de développement
- Utiliser `pnpm test:categories-system` pour diagnostics

---

*Dernière mise à jour : 2025-08-13*