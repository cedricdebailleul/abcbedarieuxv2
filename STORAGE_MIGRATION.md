# 📦 Guide de migration du stockage - ABC Bédarieux

Ce guide explique comment migrer du stockage local vers Cloudflare R2 pour sécuriser vos images.

## 🎯 Vue d'ensemble

Le système de stockage supporte 3 modes:
- **local**: Stockage sur le système de fichiers (volume Docker)
- **r2**: Cloudflare R2 uniquement (cloud storage)
- **hybrid**: Local + R2 automatique (recommandé)

---

## ✅ ÉTAPE 1: Volume Docker (FAIT ✓)

Le volume Docker a été configuré pour persister les uploads entre les redémarrages.

### Vérification

```bash
# Vérifier que le volume existe
docker volume ls | grep uploads_data

# Inspecter le volume
docker volume inspect uploads_data
```

### Restaurer les images existantes

Si vous avez des images existantes, copiez-les dans le volume:

```bash
# Arrêter les conteneurs
docker-compose down

# Copier vos images existantes
docker run --rm -v uploads_data:/target -v $(pwd)/uploads:/source alpine sh -c "cp -r /source/* /target/"

# Redémarrer
docker-compose up -d
```

---

## 🚀 ÉTAPE 2: Configuration Cloudflare R2

### 2.1 Créer un compte Cloudflare (gratuit)

1. Allez sur https://cloudflare.com
2. Créez un compte (gratuit)
3. Vérifiez votre email

### 2.2 Activer R2

1. Dans le dashboard Cloudflare, allez dans **R2 Object Storage**
2. Cliquez sur **Purchase R2 Plan** (vous ne serez pas facturé sous 10GB)
3. Acceptez les conditions

### 2.3 Créer un Bucket

1. Cliquez sur **Create bucket**
2. Nom du bucket: `abcbedarieux-uploads` (ou votre choix)
3. Région: **Automatic** (Cloudflare choisit le meilleur)
4. Cliquez sur **Create bucket**

### 2.4 Obtenir les credentials API

1. Dans **R2**, allez dans **Manage R2 API Tokens**
2. Cliquez sur **Create API token**
3. Nom: `ABC Bédarieux Upload`
4. Permissions: **Object Read & Write**
5. Sélectionnez votre bucket `abcbedarieux-uploads`
6. Cliquez sur **Create API Token**
7. **⚠️ COPIEZ ET SAUVEGARDEZ** (vous ne pourrez plus les voir):
   - Access Key ID
   - Secret Access Key
   - Account ID (aussi visible dans l'URL)

### 2.5 Configurer le domaine public

**Option A: Domaine R2.dev (gratuit, immédiat)**

1. Dans votre bucket, allez dans **Settings**
2. Activez **R2.dev subdomain**
3. Vous obtiendrez une URL: `https://pub-xxxxxx.r2.dev`

**Option B: Custom Domain (recommandé pour production)**

1. Dans **Settings** du bucket, cliquez sur **Custom Domains**
2. Ajoutez votre domaine: `uploads.abcbedarieux.fr`
3. Suivez les instructions DNS
4. Attendez la propagation (quelques minutes)

---

## ⚙️ ÉTAPE 3: Configuration de l'application

### 3.1 Variables d'environnement

Éditez votre `.env` (ou `.env.production`):

```env
# =============================================================================
# STORAGE CONFIGURATION
# =============================================================================

# Provider: local | r2 | hybrid
STORAGE_PROVIDER="hybrid"

# Dossier local (volume Docker)
UPLOADS_DIR="/app/uploads"

# =============================================================================
# CLOUDFLARE R2
# =============================================================================

# Account ID (visible dans l'URL du dashboard ou dans les credentials)
R2_ACCOUNT_ID="votre-account-id"

# API Credentials
R2_ACCESS_KEY_ID="votre-access-key-id"
R2_SECRET_ACCESS_KEY="votre-secret-access-key"

# Nom du bucket
R2_BUCKET_NAME="abcbedarieux-uploads"

# URL publique
# Option A: R2.dev subdomain
R2_PUBLIC_URL="https://pub-xxxxxx.r2.dev"

# Option B: Custom domain
# R2_PUBLIC_URL="https://uploads.abcbedarieux.fr"
```

### 3.2 Installer les dépendances

```bash
pnpm add @aws-sdk/client-s3
```

### 3.3 Redémarrer l'application

```bash
# Si Docker
docker-compose down
docker-compose up -d --build

# Si local
pnpm build
pnpm start
```

---

## 🔄 ÉTAPE 4: Migration des images existantes

### Script de migration automatique

Créez `scripts/migrate-to-r2.ts`:

```typescript
import { readdir, readFile } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { UPLOADS_ROOT } from "../lib/path";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function migrateDirectory(dir: string, prefix: string = "") {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(prefix, entry.name);

    if (entry.isDirectory()) {
      await migrateDirectory(fullPath, relativePath);
    } else {
      console.log(`📤 Upload: ${relativePath}`);

      const buffer = await readFile(fullPath);
      const contentType = entry.name.endsWith(".jpg") ? "image/jpeg"
        : entry.name.endsWith(".png") ? "image/png"
        : "application/octet-stream";

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: relativePath.replace(/\\/g, "/"),
          Body: buffer,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        })
      );

      console.log(`✅ Uploadé: ${relativePath}`);
    }
  }
}

async function migrate() {
  console.log("🚀 Début de la migration vers R2...\n");

  await migrateDirectory(UPLOADS_ROOT);

  console.log("\n✅ Migration terminée!");
}

migrate().catch(console.error);
```

**Exécuter la migration:**

```bash
pnpm tsx scripts/migrate-to-r2.ts
```

---

## 🧪 ÉTAPE 5: Tests

### Test 1: Upload une image

1. Connectez-vous à l'admin
2. Créez/éditez un commerce
3. Uploadez une photo de logo
4. Vérifiez dans les logs: `✅ Fichier uploadé: /uploads/... (+ R2: https://...)`

### Test 2: Vérifier R2

1. Allez dans votre dashboard Cloudflare > R2
2. Cliquez sur votre bucket
3. Vous devriez voir vos fichiers uploadés

### Test 3: Affichage public

1. Ouvrez la page du commerce
2. L'image doit s'afficher correctement
3. En mode `hybrid`, l'image est servie localement (rapide)

---

## 📊 Surveillance

### Vérifier l'utilisation R2

```bash
# Dashboard Cloudflare
# R2 > Votre bucket > Usage
```

**Tier gratuit:**
- ✅ 10 GB de stockage/mois
- ✅ 1M opérations Class A (uploads)
- ✅ 10M opérations Class B (downloads)
- ✅ Transfert sortant GRATUIT

### Logs applicatifs

```bash
# Vérifier les uploads
docker logs -f abcv2_app | grep "Fichier uploadé"

# Vérifier les erreurs R2
docker logs -f abcv2_app | grep "R2"
```

---

## 🔒 Sécurité

### CORS Configuration

Si vous utilisez un custom domain:

1. Dans R2 bucket > **Settings**
2. Configurez **CORS Policy**:

```json
[
  {
    "AllowedOrigins": [
      "https://www.abcbedarieux.fr",
      "https://abcbedarieux.fr"
    ],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### Permissions API Token

- ✅ **Object Read & Write** uniquement
- ✅ Limité à votre bucket spécifique
- ❌ PAS de permissions admin ou account-level

---

## 🚨 Dépannage

### Problème: "R2 configuration not available"

**Solution:**
```bash
# Vérifier les variables d'environnement
docker exec abcv2_app env | grep R2

# Vérifier que toutes les variables sont définies
```

### Problème: "Failed to upload to R2"

**Causes possibles:**
1. Credentials invalides
2. Bucket n'existe pas
3. Problème réseau

**Solution:**
```bash
# Tester la connexion R2
docker exec abcv2_app node -e "
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  region: 'auto',
  endpoint: 'https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
client.send(new ListBucketsCommand({})).then(console.log);
"
```

### Problème: Images cassées après migration

**En mode `hybrid`:**
- Les nouvelles images sont uploadées en R2 en arrière-plan
- Les anciennes images restent locales
- Utilisez le script de migration pour tout transférer

**En mode `r2`:**
- Toutes les images doivent être en R2
- Exécutez le script de migration avant de passer en mode `r2`

---

## 📈 Optimisations avancées

### CDN Cloudflare (optionnel)

Si vous utilisez un custom domain, le CDN Cloudflare est automatique!

Bénéfices:
- ⚡ Images servies depuis le serveur le plus proche
- 🔒 Protection DDoS
- 📊 Analytics

### Image Variants (optionnel)

Cloudflare peut générer des variants d'images automatiquement:

1. Activez **Image Resizing** dans votre plan Cloudflare
2. Utilisez des URLs comme: `https://uploads.abcbedarieux.fr/cdn-cgi/image/width=400/places/...`

---

## ✅ Checklist de déploiement

- [ ] Volume Docker configuré
- [ ] Compte Cloudflare créé
- [ ] Bucket R2 créé
- [ ] API Token créé et sauvegardé
- [ ] Variables d'environnement configurées
- [ ] Dépendance `@aws-sdk/client-s3` installée
- [ ] Application redémarrée
- [ ] Test upload fonctionnel
- [ ] Migration des images existantes
- [ ] CORS configuré (si custom domain)
- [ ] Surveillance active

---

## 💰 Coûts estimés

**Votre usage (50-200 commerces):**
- Stockage: 5-10 GB
- Uploads: ~1000/mois
- Downloads: ~100k/mois

**Coût mensuel: 0€** (sous le tier gratuit)

**Si dépassement:**
- Stockage: $0.015/GB (~0.15€ pour 10GB)
- Total: < 1€/mois

---

## 📞 Support

**Documentation Cloudflare R2:**
- https://developers.cloudflare.com/r2/

**En cas de problème:**
1. Vérifier les logs: `docker logs abcv2_app`
2. Tester en mode `local` d'abord
3. Passer en mode `hybrid` pour tester R2
4. Passer en mode `r2` quand tout fonctionne

---

**🎉 Félicitations! Vos images sont maintenant sécurisées et scalables!**
