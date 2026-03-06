# SEO Fixes Design — ABC Bédarieux

**Date :** 2026-03-06
**Branch :** `feature/seo-fixes`
**Priorité :** Haute (impact indexation Google)

---

## Contexte

Google Search Console remonte 3 catégories de problèmes :
1. **44 pages "Not indexed" (404)** — anciennes URLs + pages légales manquantes
2. **8 pages "5xx server error"** — pages catégories et places qui crashent
3. **48 pages "dupliquées sans canonical"** — login/register avec query params, pagination

---

## Problème 1 — Redirects 301 + renommage de pages légales

### Redirects à ajouter dans `next.config.ts`

| Ancienne URL | Nouvelle URL | Type |
|---|---|---|
| `/commerces/:slug*` | `/places/:slug` | 301 permanent |
| `/evenements/:slug*` | `/events/:slug` | 301 permanent |
| `/agenda` | `/events` | 301 permanent |
| `/autour-de-moi` | `/carte` | 301 permanent |
| `/cgu` | `/mentions-legales` | 301 permanent |
| `/terms` | `/mentions-legales` | 301 permanent |
| `/documents/privacy-policy.pdf` | `/politique-confidentialite` | 301 permanent |
| `/politique-de-cookies` | `/gestion-des-cookies` | 301 permanent |
| `/privacy` | `/politique-confidentialite` | 301 permanent |

### Renommage de pages (dossiers Next.js)

| Ancien dossier | Nouveau dossier | Impact |
|---|---|---|
| `app/(front)/privacy2/` | `app/(front)/politique-confidentialite/` | 5 liens internes à mettre à jour |
| `app/(front)/cookies/` | `app/(front)/gestion-des-cookies/` | 5 liens internes à mettre à jour |

### Nouvelle page à créer

- `app/(front)/mentions-legales/page.tsx` — CGU + mentions légales (contenu statique)

### Liens internes à mettre à jour (5 fichiers)

- `components/front/footer.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/_components/AuthLayout.tsx`
- `components/forms/contact-form.tsx`
- `app/(front)/support/page.tsx`
- `app/(front)/privacy2/page.tsx` (lien interne `/cookies` → `/gestion-des-cookies`)

---

## Problème 2 — Erreurs 5xx

### Cause probable

Les slugs de catégories (`restaurant-traditionnel`, `sante-bien-etre`, etc.) n'existent peut-être pas en DB, ou une erreur Prisma non catchée provoque un 500 au lieu d'un 404.

### Solution

Ajouter un `try/catch` autour des queries Prisma dans :
- `app/(front)/categories/[slug]/page.tsx` — wrap la query dans try/catch, appel `notFound()` en cas d'erreur
- `app/(front)/places/[slug]/page.tsx` — même traitement

---

## Problème 3 — Pages dupliquées sans canonical

### Sous-problème A : Pages auth indexées avec query params

`/login?callbackUrl=...` et `/register?callbackUrl=...` ne doivent jamais être indexées.

**Solution :** Ajouter `robots: { index: false, follow: false }` dans les `metadata` de :
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`

### Sous-problème B : Pagination de catégories

`/categories/[slug]?page=1` est considérée comme doublon de `/categories/[slug]`.

**Solution :** Dans `app/(front)/categories/[slug]/page.tsx`, ajouter une balise canonical dans `generateMetadata` pointant toujours vers l'URL sans `?page=X` quand `page === 1`, et vers l'URL avec page pour les pages suivantes.

### Sous-problème C : Vieilles URLs WordPress

`/?jet-theme-core=single_commerce-2` — URL crawlée depuis un ancien site WordPress.

**Solution :** Redirect catch-all dans `next.config.ts` pour les query params WordPress (`jet-theme-core`) → `/`.

---

## Problème 4 — Page 404 basique

La page `app/not-found.tsx` actuelle est un simple texte sans style. Refaire une vraie page 404 avec :
- Message clair et friendly
- Liens vers les sections principales (Commerces, Événements, Carte, Accueil)
- Design cohérent avec le reste du site

---

## Architecture des changements

```
next.config.ts           ← Redirects 301 (9 règles)
app/
  not-found.tsx          ← Refaire complètement
  (auth)/
    login/page.tsx       ← Ajouter noindex
    register/page.tsx    ← Ajouter noindex
  (front)/
    politique-confidentialite/  ← Renommer depuis privacy2/
    gestion-des-cookies/        ← Renommer depuis cookies/
    mentions-legales/           ← Créer (nouveau)
    categories/[slug]/page.tsx  ← try/catch + canonical
    places/[slug]/page.tsx      ← try/catch
components/front/footer.tsx     ← Mettre à jour liens
app/(auth)/_components/AuthLayout.tsx  ← Mettre à jour liens
app/(auth)/register/page.tsx    ← Mettre à jour liens
components/forms/contact-form.tsx ← Mettre à jour liens
app/(front)/support/page.tsx    ← Mettre à jour liens
```

---

## Critères de succès

- Plus aucune des 44 vieilles URLs ne retourne 404 (redirect vers page existante)
- Les 8 erreurs 5xx retournent 404 proprement
- Google ne peut plus indexer `/login?callbackUrl=...`
- Pages légales accessibles en français avec URLs compréhensibles
- Page 404 design cohérent avec le site
