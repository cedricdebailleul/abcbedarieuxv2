# Composant de Partage Social - Guide d'utilisation

Le composant `SocialShare` permet de partager facilement du contenu (événements, places, posts) sur les réseaux sociaux et autres plateformes.

## Import

```typescript
import { SocialShare } from "@/components/shared/social-share";
import { generateEventShareData, generatePlaceShareData, generatePostShareData } from "@/lib/share-utils";
```

## Utilisation de base

### Pour un événement

```tsx
<SocialShare 
  data={generateEventShareData(event)}
  variant="outline"
  size="default"
  showLabel={true}
/>
```

### Pour une place

```tsx
<SocialShare 
  data={generatePlaceShareData(place)}
  variant="default"
  size="sm"
/>
```

### Pour un post/article

```tsx
<SocialShare 
  data={generatePostShareData(post)}
  variant="ghost"
  showLabel={false}
/>
```

## Props disponibles

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `data` | `ShareData` | - | **Requis.** Données de partage générées par les helpers |
| `variant` | `"default" \| "outline" \| "ghost"` | `"outline"` | Style du bouton |
| `size` | `"default" \| "sm" \| "lg" \| "icon"` | `"default"` | Taille du bouton |
| `showLabel` | `boolean` | `true` | Afficher le texte "Partager" |
| `className` | `string` | `""` | Classes CSS supplémentaires |

## Type ShareData

```typescript
interface ShareData {
  title: string;           // Titre à partager
  description: string;     // Description/résumé
  url: string;            // URL de la page
  image?: string;         // Image de couverture (optionnel)
  type: 'post' | 'event' | 'place'; // Type de contenu
  hashtags?: string[];    // Hashtags (optionnel)
  
  // Données spécifiques selon le type
  eventDate?: string;     // Pour les événements
  eventLocation?: string; // Pour les événements
  placeAddress?: string;  // Pour les places
  placeCategory?: string; // Pour les places
}
```

## Plateformes supportées

- **Facebook** - Partage avec quote et URL
- **Twitter/X** - Partage avec hashtags optimisés
- **Instagram** - Copie du texte + ouverture de l'app
- **LinkedIn** - Partage professionnel
- **WhatsApp** - Partage mobile optimisé
- **Email** - Email pré-rempli avec contenu formaté
- **Copier le lien** - Copie dans le presse-papiers
- **Imprimer** - Impression de la page
- **Partage natif** - Si supporté par le navigateur

## Optimisations par plateforme

### Facebook
- Utilise l'Open Graph pour l'aperçu
- Inclut description complète
- Image de couverture affichée

### Twitter/X
- Hashtags automatiques selon le type de contenu
- Limitation à 280 caractères
- Format optimisé pour le mobile

### Instagram
- Copie automatique du texte
- Ouverture de l'application
- Message d'aide pour l'utilisateur

### Email
- Sujet et corps pré-remplis
- Format professionnel
- Lien vers le contenu

## Exemples d'intégration

### Dans une page d'événement
```tsx
// En haut à droite de l'image de couverture
<div className="absolute top-8 right-8">
  <SocialShare 
    data={generateEventShareData(event)}
    variant="outline"
    className="bg-white/10 backdrop-blur-sm"
    showLabel={false}
  />
</div>
```

### Dans une carte d'événement
```tsx
// En overlay sur l'image
<div className="absolute top-2 right-2">
  <SocialShare 
    data={generateEventShareData(event)}
    variant="outline"
    size="sm"
    className="bg-white/90"
    showLabel={false}
  />
</div>
```

### Dans une barre d'actions
```tsx
<div className="flex items-center gap-2">
  <SocialShare data={shareData} size="sm" />
  <FavoriteButton placeId={place.id} />
  <Button variant="outline">Signaler</Button>
</div>
```

### Version mobile/desktop responsive
```tsx
{/* Mobile - icône seule */}
<div className="md:hidden">
  <SocialShare 
    data={shareData}
    variant="ghost"
    size="icon"
    showLabel={false}
  />
</div>

{/* Desktop - avec label */}
<div className="hidden md:block">
  <SocialShare 
    data={shareData}
    variant="outline"
    size="sm"
    showLabel={true}
  />
</div>
```

## Personnalisation CSS

Le composant utilise Tailwind CSS et peut être personnalisé via la prop `className` :

```tsx
<SocialShare 
  data={shareData}
  className="shadow-lg border-2 border-primary hover:bg-primary/10"
/>
```

## Messages toast

Le composant utilise `sonner` pour afficher des messages :
- ✅ "Lien copié dans le presse-papiers"
- ✅ "Texte copié ! Collez-le dans Instagram"
- ❌ "Erreur lors de la copie du lien"

## Notes techniques

- Compatible avec les navigateurs modernes
- Supporte le partage natif sur mobile
- Gestion des erreurs intégrée
- Optimisé pour l'accessibilité
- URLs de partage sécurisées (encoded)
- Fenêtres popup centrées automatiquement