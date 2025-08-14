# Test du partage Facebook en développement local

## Problème

Facebook ne peut pas accéder à `localhost:3000` pour récupérer les métadonnées Open Graph, donc le partage apparaît vide.

## Solutions

### 1. Utiliser ngrok (Solution recommandée)

**Installation :**
```bash
# Via npm
npm install -g ngrok

# Ou télécharger depuis https://ngrok.com/
```

**Usage :**
```bash
# Dans un nouveau terminal, exposer le port 3000
ngrok http 3000
```

Vous obtiendrez une URL publique comme `https://abc123.ngrok.io`

**Test du partage :**
1. Utiliser l'URL ngrok : `https://abc123.ngrok.io/events/fete-des-commercants`
2. Partager cette URL sur Facebook
3. Facebook récupérera correctement les métadonnées

### 2. Utiliser localtunnel

**Installation et usage :**
```bash
npm install -g localtunnel
lt --port 3000
```

### 3. Modifier temporairement NEXT_PUBLIC_URL

Dans votre `.env.local`, changer :
```bash
NEXT_PUBLIC_URL=https://votre-url-ngrok.ngrok.io
```

## Test avec Facebook Debugger

1. Aller sur https://developers.facebook.com/tools/debug/
2. Entrer l'URL ngrok : `https://abc123.ngrok.io/events/fete-des-commercants`
3. Cliquer "Debug"
4. Vérifier que toutes les métadonnées sont correctes

## Résultats attendus

Avec ngrok, Facebook devrait récupérer :
- ✅ Image de couverture
- ✅ Titre "Fête des commerçants"
- ✅ Description "fete des commercants"
- ✅ URL canonique
- ✅ Dimensions image (1200x630)

## Commandes rapides

```bash
# Terminal 1: Serveur Next.js
pnpm dev

# Terminal 2: ngrok
ngrok http 3000

# Terminal 3: Test API (optionnel)
curl -s "https://VOTRE-URL-NGROK.ngrok.io/api/og-refresh?url=https://VOTRE-URL-NGROK.ngrok.io/events/fete-des-commercants"
```

## Alternative : Déploiement temporaire

Si ngrok ne fonctionne pas, déployez temporairement sur :
- Vercel : `vercel --prod`
- Netlify : `netlify deploy --prod`
- Railway : `railway deploy`

## Notes importantes

- Les URLs ngrok changent à chaque redémarrage (version gratuite)
- Pensez à mettre à jour `NEXT_PUBLIC_URL` avec l'URL ngrok
- Le partage fonctionne parfaitement en production