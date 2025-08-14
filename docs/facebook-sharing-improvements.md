# Améliorations du partage Facebook

## Problème résolu
Le partage sur Facebook ne récupérait pas les bonnes métadonnées (image, titre, description) car les données Open Graph n'étaient pas optimisées.

## Solutions implémentées

### 1. Métadonnées Open Graph améliorées

**Layout principal** (`app/layout.tsx`)
- Ajout des métadonnées Open Graph de base avec image par défaut
- Configuration Twitter Card pour tous les partages

**Pages d'événements** (`app/(front)/events/[slug]/page.tsx`)
- URLs absolues pour les images (requis par Facebook)
- Métadonnées complètes : titre, description, image, dates
- Type `article` avec `publishedTime` pour les événements

**Pages de places** (`app/(front)/places/[slug]/page.tsx`)
- URLs absolues pour les images
- Métadonnées spécifiques aux lieux avec adresses complètes

### 2. Partage Facebook optimisé

**Composant SocialShare** (`components/shared/social-share.tsx`)
- **Facebook standard** : Utilise les métadonnées Open Graph de la page
- **Création d'événement Facebook** : Lien direct pour créer un événement Facebook (visible uniquement pour les événements)
- URLs absolues pour les images générées automatiquement

**Helpers de partage** (`lib/share-utils.ts`)
- Données structurées pour Facebook Events
- Génération d'URLs absolues pour les images
- Optimisation des textes selon la plateforme

### 3. Données structurées JSON-LD

**Événements** (`components/structured-data/event-schema.tsx`)
- Schema.org complet pour les événements
- Reconnaissance automatique par Facebook, Google, etc.
- Informations sur l'organisateur, le lieu, les prix

**Places** (`components/structured-data/place-schema.tsx`)
- Schema.org pour les entreprises locales
- Horaires d'ouverture, coordonnées, catégories
- Support des différents types d'établissements

### 4. API de debug et rafraîchissement

**API Open Graph** (`app/api/og-refresh/route.ts`)
- `GET /api/og-refresh?url=...` : Teste les métadonnées d'une URL
- `POST /api/og-refresh` : Force le rafraîchissement du cache Facebook
- Extraction et validation des balises Open Graph

**Composant de debug** (`components/debug/og-debug.tsx`)
- Visible uniquement en développement
- Test des métadonnées en temps réel
- Lien direct vers Facebook Debugger
- Rafraîchissement du cache Facebook

## Usage

### Pour partager un événement sur Facebook

1. **Partage standard** : Facebook récupère automatiquement :
   - Image de couverture de l'événement
   - Titre et description
   - Date et lieu
   - URL canonique

2. **Création d'événement Facebook** : Bouton spécial qui :
   - Pré-remplit le formulaire Facebook
   - Inclut titre, description, lieu, date
   - Redirige vers la création d'événement Facebook

### Debug et tests

1. **En développement** : Composant de debug visible en bas des pages
2. **Tester les métadonnées** : `GET /api/og-refresh?url=https://example.com`
3. **Facebook Debugger** : https://developers.facebook.com/tools/debug/

### Vérification Facebook

Pour vérifier que le partage fonctionne :

1. Aller sur une page d'événement ou de place
2. Copier l'URL
3. Aller sur Facebook Debugger : https://developers.facebook.com/tools/debug/
4. Coller l'URL et cliquer "Debug"
5. Vérifier que les métadonnées sont correctes

## Images par défaut

Les images par défaut suivantes sont nécessaires dans `/public/images/` :
- `og-default.jpg` (1200x630px) - Image par défaut du site
- `og-event-default.jpg` (1200x630px) - Image par défaut pour les événements
- `og-place-default.jpg` (1200x630px) - Image par défaut pour les places

## Résultat

✅ Facebook récupère maintenant correctement :
- Images de couverture des événements et places
- Titres et descriptions optimisées
- Métadonnées structurées pour un meilleur affichage
- Possibilité de créer des événements Facebook directement

✅ Amélioration SEO globale avec les données structurées JSON-LD

✅ Debug et tests facilités en développement