# 🔐 Guide de Sauvegarde et Restauration - ABC Bédarieux

## 📋 Variables d'Environnement Critiques à Sauvegarder

### 🔑 **Authentification et Sécurité**
```env
# Better Auth - Secret principal (CRITIQUE)
BETTER_AUTH_SECRET=your-secret-here

# URLs de base
NEXT_PUBLIC_URL=https://votre-domaine.com
NEXTAUTH_URL=https://votre-domaine.com
```

### 🗄️ **Base de Données**
```env
# PostgreSQL (CRITIQUE)
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database
```

### 🔐 **OAuth Providers**
```env
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 📧 **Configuration Email/SMTP**
```env
# SMTP pour emails (CRITIQUE)
SMTP_HOST=smtp.votre-provider.com
SMTP_PORT=587
SMTP_USER=votre-email@domaine.com
SMTP_PASSWORD=votre-mot-de-passe-smtp
SMTP_FROM=noreply@votre-domaine.com
SMTP_SECURE=false
```

### 🗺️ **Google Maps API**
```env
# Google Maps (CRITIQUE pour les cartes)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_MAPS_API_KEY=your-server-side-google-maps-key
```

### 💬 **WhatsApp Bot**
```env
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
```

### ☁️ **Stockage Cloud (optionnel)**
```env
# AWS S3 pour stockage de fichiers
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=your-bucket-name
```

### 🔧 **Configuration GDPR**
```env
# Conformité RGPD
GDPR_CONTACT_EMAIL=contact@votre-domaine.com
GDPR_DATA_RETENTION_DAYS=1095
```

### 🚀 **Déploiement**
```env
# Vercel/déploiement
VERCEL_URL=your-vercel-url
NODE_ENV=production
```

### 🔒 **Tokens de Sécurité pour Sauvegarde**
```env
# Token pour les sauvegardes automatiques (NOUVEAU)
BACKUP_CRON_TOKEN=your-secure-backup-token-here
```

## 🛠️ **Procédure de Restauration Complète**

### 1. **Préparatifs Serveur**
```bash
# Installer Node.js et pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh

# Cloner le repository
git clone https://github.com/votre-repo/abc-bedarieux.git
cd abc-bedarieux

# Installer les dépendances
pnpm install
```

### 2. **Configuration Base de Données**
```bash
# Créer la base de données PostgreSQL
createdb abc_bedarieux

# Configurer les variables d'environnement (voir ci-dessus)
cp .env.example .env
# Éditer .env avec vos valeurs

# Appliquer le schéma Prisma
pnpm db:push
pnpm db:generate
```

### 3. **Restauration des Données**
```bash
# Via l'interface admin (recommandé)
# Aller sur https://votre-site.com/dashboard/admin
# Utiliser l'outil "Restaurer depuis sauvegarde"
# Uploader le fichier backup JSON

# Ou via API directe
curl -X POST https://votre-site.com/api/admin/restore \
  -H "Content-Type: multipart/form-data" \
  -F "file=@backup-file.json"
```

### 4. **Restauration des Fichiers**
```bash
# Copier manuellement le dossier uploads
cp -r backup-uploads/ public/uploads/

# Ou utiliser rsync pour sync
rsync -av backup-uploads/ public/uploads/
```

### 5. **Tests Post-Restauration**
```bash
# Vérifier la compilation
pnpm build

# Vérifier les types
pnpm type-check

# Vérifier le linting
pnpm lint

# Tester l'application
pnpm dev
```

## 📅 **Configuration Sauvegarde Automatique**

### **Cron Job Système (recommandé)**
```bash
# Ajouter à crontab pour sauvegarde quotidienne à 2h du matin
0 2 * * * curl -X POST https://votre-site.com/api/admin/backup/scheduled \
  -H "Authorization: Bearer YOUR_BACKUP_CRON_TOKEN"
```

### **Sauvegarde Hebdomadaire des Fichiers**
```bash
# Script pour sauvegarder les uploads
#!/bin/bash
DATE=$(date +%Y-%m-%d)
tar -czf "backups/uploads-backup-$DATE.tar.gz" public/uploads/
```

## 🚨 **Checklist de Récupération d'Urgence**

### ✅ **Avant le Problème (Préparation)**
- [ ] Sauvegardes automatiques configurées
- [ ] Variables d'environnement documentées dans un endroit sécurisé
- [ ] Copies des fichiers uploads sauvegardées
- [ ] Accès aux comptes cloud/services (GitHub, Google, SMTP)
- [ ] Documentation des configurations serveur

### 🚀 **Après le Problème (Restauration)**
- [ ] Nouveau serveur provisionné
- [ ] Repository Git cloné
- [ ] Dépendances installées (`pnpm install`)
- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL créée
- [ ] Schéma Prisma appliqué (`pnpm db:push`)
- [ ] Données restaurées via backup JSON
- [ ] Fichiers uploads restaurés
- [ ] Tests de fonctionnement effectués
- [ ] DNS/domaine reconfiguré

## 📊 **Couverture de Sauvegarde Actuelle**

### ✅ **Maintenant Sauvegardé (95%+)**
- Tous les utilisateurs et profils
- Toutes les places et catégories
- Tous les événements et participations
- Tous les posts et articles
- Système de badges complet
- Données ABC association complètes
- Newsletter complète avec campagnes
- Avis et évaluations
- Produits, services et offres
- Partenaires commerciaux
- Configuration historique du site
- Conversations WhatsApp
- Tags et catégories de contenu
- Statistiques et vues
- Notifications utilisateur

### ⚠️ **Encore Non Sauvegardé**
- Sessions utilisateur actives (normal - se reconnectent)
- Tokens de vérification email temporaires (normal - regénérés)
- Queue emails en cours d'envoi (acceptable - reprend automatiquement)
- Fichiers uploads (nécessite sauvegarde manuelle/script)

## 🎯 **Recommandations Finales**

1. **Sauvegarde Quotidienne** - Configurer le cron job automatique
2. **Sauvegarde Fichiers** - Script hebdomadaire pour /uploads/
3. **Test de Restauration** - Tester la procédure 1x/mois sur environnement de test
4. **Documentation à Jour** - Tenir cette documentation à jour
5. **Monitoring** - Surveiller les échecs de sauvegarde

---

**🚨 IMPORTANT**: Gardez ce fichier et les backups dans un endroit sécurisé séparé du serveur principal !