# Enhanced Header - Guide d'utilisation

## 🎯 Vue d'ensemble

Le nouveau header `EnhancedHeader` remplace l'ancien système complexe par une solution unifiée, accessible et responsive. Il présente un mega menu moderne avec une excellente expérience utilisateur sur tous les appareils.

## 🏗️ Architecture

### Structure simplifiée
- **Header principal** : Logo + Navigation + Actions
- **Mega menu unifié** : Navigation par onglets avec sections organisées  
- **Menu mobile** : Sidebar avec sections collapsibles
- **Accessibilité** : Support complet clavier + screen readers

### Sections du menu
1. **Découvrir** - Pages institutionnelles (Accueil, À propos, Histoire)
2. **Établissements** - Places et services (Tous, Catégories, Carte)
3. **Événements** - Événements locaux (Tous, Simples)
4. **Contenu** - Publications (Articles, Actualités, Actions)

## 🚀 Utilisation

### Installation
```tsx
import EnhancedHeader from "@/components/front/header/enhanced-header";

export default function Layout({ children }) {
  return (
    <div>
      <EnhancedHeader />
      <main id="main-content">
        {children}
      </main>
    </div>
  );
}
```

### Props disponibles
```tsx
interface HeaderProps {
  className?: string; // Classes CSS additionnelles
}
```

### Configuration du contenu
Le contenu du menu est défini dans la constante `menuData` :

```tsx
const menuData: MenuSection[] = [
  {
    id: "discover",
    title: "Découvrir", 
    icon: Home,
    color: "primary", // primary | blue-600 | green-600 | orange-600
    items: [
      {
        id: "home",
        label: "Accueil",
        href: "/",
        description: "Retour à la page d'accueil",
        icon: Home,
        featured: true // Optionnel : marque comme populaire
      }
      // ... autres items
    ],
    featured: {
      // Item featured spécial pour cette section
      id: "newsletter",
      label: "Newsletter", 
      href: "/newsletter/subscribe",
      description: "Restez informé de nos actualités",
      icon: FileText,
    }
  }
  // ... autres sections
];
```

## 📱 Responsive Design

### Breakpoints
- **Desktop** (`lg+`, >1024px) : Mega menu complet avec onglets
- **Tablet** (`md-lg`, 768-1024px) : Mega menu adapté 
- **Mobile** (`<lg`, <1024px) : Menu hamburger → sidebar

### Comportements adaptatifs
- **Scroll** : Header devient fixe avec backdrop-blur
- **Touch** : Gestes optimisés pour mobile
- **Hover** : Désactivé sur tactile, focus visible maintenu

## ♿ Accessibilité

### Navigation clavier
| Touche | Action |
|--------|--------|
| `Tab` / `Shift+Tab` | Navigation séquentielle |
| `↑` / `↓` | Navigation verticale dans le menu |
| `Enter` / `Space` | Ouvrir/fermer sections |
| `Escape` | Fermer tous les menus |

### Screen readers
- **Annonces** : Changements d'état vocalisés
- **ARIA** : Attributes complets (`role`, `aria-expanded`, etc.)
- **Landmarks** : `<nav>`, `<main>`, zones sémantiques
- **Skip link** : Accès direct au contenu principal

### Focus management
- **Piégeage** : Focus reste dans le menu ouvert
- **Retour** : Focus revient au déclencheur après fermeture
- **Visibilité** : Outline personnalisé avec `focus-visible`

## 🎨 Personnalisation

### Classes CSS
Le composant utilise Tailwind avec des tokens CSS variables :

```css
/* Couleurs principales */
--primary: /* Couleur principale du thème */
--secondary: /* Couleur secondaire */

/* Classes modifiables */
.header-button { @apply focus:ring-primary focus:ring-offset-2; }
.menu-item { @apply hover:bg-primary/5 hover:text-primary; }
```

### Couleurs par section
```tsx
const getColorClasses = (color: string) => {
  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    "blue-600": "text-blue-600 bg-blue-50 border-blue-200",
    "green-600": "text-green-600 bg-green-50 border-green-200", 
    "orange-600": "text-orange-600 bg-orange-50 border-orange-200",
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.primary;
};
```

## 🧪 Test et debugging

### Composant de démonstration
```tsx
import HeaderDemo from "@/components/front/header/header-demo";

// Page de test complète avec instructions
export default function TestPage() {
  return <HeaderDemo />;
}
```

### Tests recommandés
1. **Navigation clavier** : Parcours complet Tab → ↑↓ → Enter → Escape
2. **Responsive** : Redimensionnement entre tous les breakpoints
3. **Screen reader** : Test avec NVDA/JAWS/VoiceOver
4. **Touch** : Interactions tactiles sur mobile/tablet
5. **Performance** : Vérifier fluidité des animations

### Debug mode
Pour activer les logs de debug :
```tsx
const DEBUG_HEADER = process.env.NODE_ENV === 'development';

// Dans le composant
useEffect(() => {
  if (DEBUG_HEADER) {
    console.log('Header state:', { isMegaMenuOpen, activeSection });
  }
}, [isMegaMenuOpen, activeSection]);
```

## 🔄 Migration depuis l'ancien header

### Remplacement
1. Remplacer `import Header from "./header"` par `import EnhancedHeader from "./enhanced-header"`
2. Supprimer les props obsolètes (pas de changement d'API)
3. Vérifier que `#main-content` existe pour le skip link

### Différences comportementales
- **Menu unifié** : Plus de distinction top bar / main nav
- **États simplifiés** : Un seul état de menu au lieu de plusieurs
- **Scroll** : Comportement fixe plus fluide
- **Mobile** : Sidebar au lieu de dropdown

## 📈 Performance

### Optimisations
- **Animations** : GPU-accelerated avec `transform`
- **Lazy loading** : Contenu menu chargé à l'ouverture
- **Event listeners** : Nettoyage automatique avec `useEffect`
- **Re-renders** : Memoization des callbacks coûteux

### Métriques cibles
- **CLS** : 0 (layout stable)
- **FID** : <100ms (interactions fluides) 
- **Bundle** : +15kb gzippé vs ancien header

## 🐛 Troubleshooting

### Problèmes courants

**Menu ne s'ouvre pas**
- Vérifier que les handlers d'événements sont attachés
- Contrôler l'état `isMegaMenuOpen` dans les dev tools

**Navigation clavier ne fonctionne pas**  
- Vérifier les `tabindex` et `aria-` attributes
- Contrôler que les éléments sont focusables

**Responsive cassé**
- Vérifier les breakpoints Tailwind (`lg:`, `md:`)
- Contrôler le viewport meta tag

**Animations saccadées**
- Vérifier que `framer-motion` est installé
- Contrôler les `will-change` CSS

## 📚 Dépendances

### Packages requis
- `framer-motion` : Animations fluides
- `lucide-react` : Icônes vectorielles  
- `@tailwindcss/forms` : Styles formulaires
- `tailwindcss` : Framework CSS

### Composants internes
- `NavUser` : Gestion utilisateur
- `SearchMenu` : Recherche
- `ThemeToggle` : Mode sombre
- `Logo` : Logo du site

## 🎯 Roadmap

### Prochaines améliorations
- [ ] Support RTL (right-to-left)
- [ ] Mode haut contraste
- [ ] Raccourcis clavier globaux
- [ ] Favoris dans le menu
- [ ] Recherche prédictive
- [ ] Analytics des interactions

---

*Dernière mise à jour : Janvier 2025*
*Version : 1.0.0*