# Améliorations de l'impression

## Vue d'ensemble

Le système d'impression a été complètement optimisé pour offrir une expérience d'impression professionnelle pour les événements et lieux.

## Fonctionnalités d'impression

### 🎯 **Styles d'impression optimisés**

**Éléments masqués à l'impression :**
- Navigation, header, footer (sauf ceux marqués `.print-keep`)
- Boutons et éléments interactifs
- Menus déroulants
- Sidebar et cookie banner
- Éléments décoratifs (SVG, sauf `.print-keep`)

**Éléments adaptés :**
- Typography optimisée (12pt base, hiérarchie claire)
- Couleurs converties pour l'impression N&B
- Layout adapté (grilles → blocs)
- Images redimensionnées
- Liens avec URLs affichées

### 📄 **En-tête d'impression professionnel**

Composant `PrintHeader` qui affiche :
- Logo "ABC Bédarieux" 
- Date d'impression
- Titre du contenu
- Sous-titre contextuel
- Informations spécifiques (date événement, adresse lieu)

### 🖼️ **Gestion des images**

**Images de couverture :**
- Redimensionnement automatique (max 300pt)
- Bordures pour délimiter
- Conservation du ratio d'aspect

**Galeries :**
- Grille 3 colonnes (2 sur mobile)
- Images thumbnail 80pt de hauteur
- Évitement des coupures de page

### 📝 **Mise en page optimisée**

**Métadonnées événements :**
- Boîte d'informations mise en valeur
- Date, heure, lieu clairement identifiés
- Tarifs et contact en évidence
- Liste des occurrences pour événements récurrents

**Informations lieux :**
- Adresse complète
- Horaires d'ouverture formatés
- Coordonnées de contact
- Type et catégories

### 🗺️ **Gestion des cartes**

- Maps Google masquées (non imprimables)
- Remplacement par texte "Voir la carte en ligne"
- Coordonnées GPS affichées si disponibles

## Utilisation

### **Via le composant SocialShare**

```tsx
<SocialShare 
  data={shareData}
  variant="outline"
  size="sm"
/>
```

Le bouton "Imprimer" :
1. Ajoute la classe `printing` au body
2. Lance l'impression après 100ms
3. Nettoie les classes après impression

### **Classes CSS spécialisées**

```css
/* Garder un élément visible en impression */
.print-keep { }

/* Masquer un élément à l'impression */
.no-print { display: none !important; }

/* Forcer un saut de page */
.print-page-break { page-break-before: always !important; }

/* Éviter la coupure */
.print-section { page-break-inside: avoid !important; }
```

## Structure d'impression type

### **Événement imprimé :**
1. **En-tête** : Logo, date impression, titre événement
2. **Image de couverture** : Redimensionnée et encadrée  
3. **Informations principales** : Date, lieu, prix, description
4. **Contact organisateur** : Téléphone, email, site web
5. **Localisation** : Adresse, plan d'accès (texte)
6. **Galerie** : Images en grille 3x3
7. **Dates récurrentes** : Liste complète des occurrences

### **Lieu imprimé :**
1. **En-tête** : Logo, date impression, nom établissement
2. **Image de couverture** : Photo principale
3. **Informations pratiques** : Adresse, type, catégories
4. **Horaires** : Planning hebdomadaire formaté
5. **Contact** : Téléphone, email, site web, réseaux sociaux  
6. **Localisation** : Adresse complète, coordonnées GPS
7. **Galerie** : Photos de l'établissement

## Personnalisation

### **Variables d'impression**

Les styles utilisent des variables CSS pour faciliter la personnalisation :

```css
@media print {
  :root {
    --print-font-size: 12pt;
    --print-line-height: 1.4;
    --print-margin: 20pt;
    --print-border-color: #ccc;
  }
}
```

### **Classes de layout**

- `.print-layout` : Container principal
- `.print-content` : Contenu principal  
- `.print-meta` : Boîte de métadonnées
- `.print-contact` : Informations de contact
- `.print-gallery` : Galerie d'images
- `.print-info-card` : Carte d'information importante

## Responsive Print

**Desktop (A4) :**
- Marges 20pt
- Galerie 3 colonnes
- Typography complète

**Mobile print :**
- Marges réduites (10pt)
- Galerie 2 colonnes  
- Titres adaptés

## Optimisations techniques

### **Performance**
- Styles appliqués seulement à l'impression
- Délai minimal pour application CSS
- Nettoyage automatique des classes

### **Compatibilité**
- Support tous navigateurs modernes
- Fallbacks pour anciens navigateurs
- Gestion des préférences d'impression

### **Qualité**
- Force l'impression des couleurs (`color-adjust: exact`)
- Évite les coupures inappropriées (`page-break-inside: avoid`)
- Typography optimisée pour l'impression

## Test de l'impression

1. **Aperçu** : Ctrl+P → Aperçu avant impression
2. **Mode développement** : Outils dev → Rendering → Emulate CSS media → print
3. **Test réel** : Impression sur imprimante physique ou PDF

## Résultat

✅ **Impression professionnelle** avec logo et date
✅ **Layout adapté** sans éléments de navigation  
✅ **Images optimisées** et bien dimensionnées
✅ **Informations complètes** et structurées
✅ **Typography lisible** avec hiérarchie claire
✅ **Responsive** pour différents formats d'impression

L'utilisateur obtient un document imprimé propre et informatif, parfait pour archivage ou distribution physique.