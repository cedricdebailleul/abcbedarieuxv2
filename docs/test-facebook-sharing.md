# Test du partage Facebook

## Prérequis

1. Assurez-vous que `NEXT_PUBLIC_URL` est configuré dans votre `.env.local`
2. Vérifiez que les images par défaut existent dans `/public/images/`

## Tests à effectuer

### 1. Test des métadonnées Open Graph

#### Via l'API de debug

```bash
# Tester une page d'événement
curl "http://localhost:3000/api/og-refresh?url=http://localhost:3000/events/concert-ete-bedarieux"

# Tester une page de place
curl "http://localhost:3000/api/og-refresh?url=http://localhost:3000/places/restaurant-petit-bistrot"
```

#### Via le composant de debug (en développement)

1. Aller sur une page d'événement ou de place
2. Descendre en bas de la page
3. Cliquer sur "Tester métadonnées"
4. Vérifier que les données Open Graph sont correctes

### 2. Test avec Facebook Debugger

1. Aller sur https://developers.facebook.com/tools/debug/
2. Entrer l'URL d'un événement ou d'une place
3. Cliquer "Debug"
4. Vérifier :
   - ✅ Image de couverture affichée
   - ✅ Titre correct
   - ✅ Description appropriée
   - ✅ URL canonique
   - ✅ Type de contenu (article)

### 3. Test du partage en situation réelle

#### Partage standard

1. Aller sur Facebook
2. Créer un nouveau post
3. Coller l'URL d'un événement
4. Vérifier que Facebook récupère automatiquement :
   - L'image de couverture
   - Le titre de l'événement
   - La description/résumé
   - Les informations de date et lieu

#### Création d'événement Facebook

1. Sur une page d'événement, cliquer "Partager"
2. Choisir "Créer événement Facebook"
3. Vérifier que le formulaire Facebook est pré-rempli avec :
   - Nom de l'événement
   - Description
   - Lieu
   - Date et heure

### 4. Test des données structurées

#### Validation JSON-LD

1. Aller sur une page d'événement ou de place
2. Ouvrir les outils de développement
3. Chercher `<script type="application/ld+json">`
4. Copier le contenu JSON
5. Valider sur https://validator.schema.org/

#### Test Google Rich Snippets

1. Aller sur https://search.google.com/test/rich-results
2. Entrer l'URL d'un événement
3. Vérifier que les données structurées sont reconnues

## Résultats attendus

### Événements

```json
{
  "openGraph": {
    "title": "Concert d'été à Bédarieux",
    "description": "Une soirée musicale exceptionnelle en plein air",
    "url": "https://abc-bedarieux.fr/events/concert-ete-bedarieux",
    "image": "https://abc-bedarieux.fr/uploads/events/concert-ete.jpg",
    "type": "article",
    "site_name": "ABC Bédarieux"
  },
  "twitter": {
    "card": "summary_large_image",
    "title": "Concert d'été à Bédarieux",
    "description": "Une soirée musicale exceptionnelle en plein air",
    "image": "https://abc-bedarieux.fr/uploads/events/concert-ete.jpg"
  }
}
```

### Places

```json
{
  "openGraph": {
    "title": "Restaurant Le Petit Bistrot",
    "description": "Cuisine traditionnelle française dans une ambiance chaleureuse",
    "url": "https://abc-bedarieux.fr/places/restaurant-petit-bistrot",
    "image": "https://abc-bedarieux.fr/uploads/places/bistrot-cover.jpg",
    "type": "article",
    "site_name": "ABC Bédarieux"
  },
  "twitter": {
    "card": "summary_large_image",
    "title": "Restaurant Le Petit Bistrot",
    "description": "Cuisine traditionnelle française dans une ambiance chaleureuse",
    "image": "https://abc-bedarieux.fr/uploads/places/bistrot-cover.jpg"
  }
}
```

## Dépannage

### Image non affichée sur Facebook

1. Vérifier que l'image est accessible publiquement
2. Utiliser une URL absolue (commençant par http/https)
3. Image recommandée : 1200x630px, moins de 8MB
4. Rafraîchir le cache Facebook via l'API ou le debugger

### Métadonnées non mises à jour

1. Utiliser le bouton "Rafraîchir FB" dans le composant de debug
2. Ou appeler l'API : `POST /api/og-refresh` avec l'URL
3. Attendre quelques minutes pour la propagation

### Événement Facebook non créé

1. Vérifier que toutes les données requises sont présentes (titre, date, lieu)
2. S'assurer que les dates sont au bon format
3. Utiliser les données structurées pour un meilleur mapping

## Commandes utiles

```bash
# Tester l'API en local
curl -X POST http://localhost:3000/api/og-refresh \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:3000/events/mon-evenement"}'

# Valider les données structurées
curl -s http://localhost:3000/events/mon-evenement | grep -o '<script type="application/ld+json">.*</script>'
```