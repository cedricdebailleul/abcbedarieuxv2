# Carte Interactive - ABC Bédarieux

## Vue d'ensemble

La carte interactive permet de visualiser et de rechercher tous les établissements de Bédarieux de manière intuitive avec une interface moderne et accessible.

## 🗺️ **Fonctionnalités principales**

### **Interface utilisateur**
- **Layout spécialisé** avec header et carte pleine hauteur
- **Sidebar de filtres** (desktop) et overlay mobile
- **Carte Google Maps** avec markers personnalisés colorés
- **Cards popup** avec animations fluides
- **Design responsive** optimisé mobile et desktop

### **Filtres avancés**
- **Recherche textuelle** : nom, catégorie, adresse
- **Catégories hierarchiques** : principales + sous-catégories  
- **Filtre par distance** : 500m à 20km (géolocalisation)
- **Statut ouverture** : afficher seulement les ouverts
- **Tri** : à la une, nom alphabétique, distance

### **Markers intelligents**
- **Couleurs par catégorie** : couleurs personnalisées ou générées
- **Icônes contextuelles** : émojis selon type/catégorie
- **États visuels** : sélection, hover, featured
- **Animation** : pulse pour position utilisateur

### **Cards des places**
- **Informations complètes** : nom, description, contact, horaires
- **Statut temps réel** : ouvert/fermé avec prochaine heure
- **Actions directes** : itinéraire Google Maps, fiche complète
- **Design adaptatif** : modal mobile, sidebar desktop

## 📱 **Accessibilité & UX Mobile**

### **Mobile-First Design**
- **Filtres en overlay** avec bouton floating
- **Cards en modal** plein écran avec slide animation
- **Géolocalisation automatique** pour calculs de distance
- **Bouton recentrage** sur position utilisateur
- **Interactions tactiles** optimisées

### **Animations & Transitions**
- **Framer Motion** pour animations fluides
- **Markers animés** avec hover et sélection
- **Cards avec slide/scale** selon device
- **Loading states** avec skeletons

### **Performance**
- **Lazy loading** des données
- **Suspense boundaries** pour chargement
- **Markers optimisés** avec AdvancedMarkerElement
- **Filtrage côté client** pour réactivité

## 🛠️ **Architecture technique**

### **Structure des fichiers**
```
app/carte/
├── layout.tsx          # Layout spécialisé avec header
└── page.tsx            # Page principale avec Suspense

components/map/
├── interactive-map.tsx    # Composant principal
├── map-view.tsx          # Vue Google Maps
├── map-filters.tsx       # Filtres desktop
├── mobile-map-filters.tsx # Filtres mobile
├── place-card.tsx        # Card popup place
└── map-skeleton.tsx      # Loading skeleton

lib/
├── map-utils.ts          # Calculs distance, couleurs
└── opening-hours-utils.ts # Calculs horaires ouverture
```

### **Dépendances**
- `@googlemaps/js-api-loader` : Google Maps JavaScript API
- `framer-motion` : Animations et transitions
- `@radix-ui/react-*` : Composants UI accessibles

## ⚙️ **Configuration**

### **Variables d'environnement**
```bash
# Google Maps API Key (obligatoire)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_api_key_here"
```

### **API Google Maps**
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer/sélectionner un projet
3. Activer l'API "Maps JavaScript API"
4. Créer des credentials (API Key)
5. Configurer les restrictions (optionnel)

### **APIs utilisées**
- **Maps JavaScript API** : affichage carte
- **Geocoding API** : conversion adresses (optionnel)
- **Places API** : enrichissement données (optionnel)

## 📊 **Données et requêtes**

### **Requête places**
```typescript
// Récupération places actives avec coordonnées
const places = await prisma.place.findMany({
  where: {
    status: PlaceStatus.ACTIVE,
    isActive: true,
    AND: [
      {
        OR: [
          { latitude: { not: null } },
          { longitude: { not: null } },
        ]
      }
    ]
  },
  include: {
    categories: { include: { category: true } },
    openingHours: true,
    _count: { select: { reviews: true, googleReviews: true } }
  }
});
```

### **Calculs en temps réel**
- **Distance** : formule Haversine
- **Statut ouverture** : horaires vs heure actuelle
- **Filtrage** : recherche multi-critères côté client

## 🎨 **Personnalisation**

### **Couleurs des catégories**
- Utilise `category.color` si définie
- Génère automatiquement via hash du nom
- Palette HSL pour cohérence visuelle

### **Markers personnalisés**
```typescript
// Création marker avec couleur et icône
const createCustomMarker = (place: MapPlace): HTMLElement => {
  const color = getCategoryColor(place.categories[0]);
  const icon = getPlaceTypeIcon(place.type);
  // HTML personnalisé avec Tailwind CSS
};
```

### **Styles de carte**
- Masque POI Google par défaut
- Style cartographique neutre
- Contrôles positionnés à droite

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile** (`< lg`) : Filtres overlay, cards modal
- **Desktop** (`>= lg`) : Sidebar + carte, cards popup

### **Adaptations mobiles**
- Bouton filtres floating avec indicateur
- Cards plein écran avec slide animation
- Géolocalisation proactive
- Touch-friendly interactions

## 🚀 **Utilisation**

### **Navigation**
- Accessible via `/carte` dans le header
- Icône 🗺️ pour identification visuelle

### **Interactions utilisateur**
1. **Recherche/filtres** : affinage en temps réel
2. **Clic marker** : ouverture card détaillée  
3. **Géolocalisation** : calcul distances automatique
4. **Actions directes** : itinéraire et fiche complète

### **Cas d'usage**
- Découverte établissements par zone
- Recherche par spécialité/catégorie
- Planification parcours avec distances
- Vérification horaires en temps réel

## 🔧 **Extensions possibles**

### **Fonctionnalités avancées**
- **Clusters** pour markers nombreux
- **Heatmap** selon popularité
- **Directions API** pour itinéraires intégrés
- **Street View** dans les cards
- **Mode hors-ligne** avec service worker

### **Analytics**
- Tracking interactions markers
- Mesure utilisation filtres
- Analyse parcours utilisateur

## ✅ **Résultat**

**🎯 Carte interactive complète** avec :
- ✅ **Interface moderne** desktop + mobile
- ✅ **Filtres avancés** multi-critères
- ✅ **Markers colorés** avec icônes contextuelles  
- ✅ **Cards détaillées** avec animations
- ✅ **Géolocalisation** et calculs distance
- ✅ **Statuts temps réel** ouvert/fermé
- ✅ **Accessibilité** et UX optimisée
- ✅ **Performance** et responsive design

L'utilisateur bénéficie d'une expérience de recherche spatiale fluide et intuitive pour découvrir les établissements de Bédarieux.