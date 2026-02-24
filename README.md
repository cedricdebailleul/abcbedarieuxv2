# ABC Bedarieux v2

Annuaire local des commerces, associations et services de Bedarieux et ses environs.

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **Base de donnees** : PostgreSQL + Prisma ORM
- **Authentification** : Better Auth (email/password, OAuth GitHub/Google)
- **UI** : shadcn/ui + Radix UI + Tailwind CSS
- **Animation** : Framer Motion, GSAP
- **Email** : Nodemailer + systeme de newsletter complet
- **Validation** : Zod + React Hook Form
- **Deploiement** : Coolify (Docker standalone)

## Demarrage rapide

### Prerequis

- Node.js >= 20.19
- pnpm
- PostgreSQL

### Installation

```bash
pnpm install
cp .env.example .env  # Configurer les variables d'environnement
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### Developpement

```bash
pnpm dev          # Serveur de dev avec Turbopack
pnpm lint         # ESLint
pnpm type-check   # Verification TypeScript
pnpm test         # Tests unitaires
```

### Production

```bash
pnpm build
pnpm start
```

## Structure du projet

```
app/
  (auth)/           # Pages d'authentification (login, register, verify)
  (dashboard)/      # Zone protegee avec sidebar
    admin/          # Interface d'administration
  (front)/          # Pages publiques
  api/              # Routes API
    admin/          # APIs admin protegees
    newsletter/     # APIs newsletter publiques

components/
  ui/               # Composants shadcn/ui
  forms/            # Formulaires
  layout/           # Layout (header, sidebar)
  admin/newsletter/ # Composants admin newsletter

lib/
  auth.ts           # Configuration Better Auth
  prisma.ts         # Client Prisma
  env.ts            # Variables d'environnement typees (T3 Env)
  email.ts          # Systeme de templates email
  generated/prisma/ # Client Prisma genere
```

## Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | URL PostgreSQL | Oui |
| `BETTER_AUTH_SECRET` | Secret auth (min 32 chars) | Oui |
| `NEXT_PUBLIC_URL` | URL publique du site | Oui |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Cle API Google Maps (client) | Oui |
| `GOOGLE_MAPS_API_KEY` | Cle API Google Places (serveur) | Non |
| `GITHUB_CLIENT_ID/SECRET` | OAuth GitHub | Non |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth Google | Non |
| `SMTP_*` | Configuration email | Non |

## Commandes disponibles

### Base de donnees

```bash
pnpm db:push       # Appliquer le schema Prisma
pnpm db:migrate     # Executer les migrations
pnpm db:generate    # Generer le client Prisma
pnpm db:studio      # Lancer Prisma Studio
pnpm db:seed        # Seed initial (badges)
pnpm db:reset       # Reset complet
```

### Tests

```bash
pnpm test           # Executer les tests Jest
pnpm test:watch     # Mode watch
pnpm test:coverage  # Rapport de couverture
```

### Sauvegardes

```bash
pnpm backup:full    # Sauvegarde complete
pnpm backup:db      # Sauvegarde base de donnees
pnpm backup:files   # Sauvegarde fichiers
```

## Fonctionnalites principales

- **Annuaire de places** : fiches detaillees avec horaires, avis Google, categories
- **Evenements** : calendrier et gestion des evenements locaux
- **Blog/Articles** : systeme de publication avec editeur riche
- **Newsletter** : campagnes email avec tracking, templates, pieces jointes
- **Systeme de badges** : gamification pour les utilisateurs
- **RGPD** : consentement cookies, demandes de donnees, nettoyage automatique
- **Roles** : admin, moderateur, editeur, utilisateur

## Securite

- Middleware de protection des routes protegees
- Security headers (HSTS, X-Frame-Options, CSP)
- Sanitisation XSS via DOMPurify
- Validation des entrees avec Zod
- Rate limiting disponible (Arcjet/Upstash)
- Protection CSRF via Better Auth trustedOrigins

## Licence

Projet prive - ABC Bedarieux
