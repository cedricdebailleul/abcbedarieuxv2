# Configuration Google Drive pour ABC Bédarieux

Ce guide explique comment configurer la sauvegarde automatique vers Google Drive.

## 🚀 Fonctionnalités implémentées

### ✅ Sauvegardes automatiques
- **Base de données** : Export SQL complet avec métadonnées
- **Dossier uploads** : Archive ZIP de tous les fichiers uploads
- **Sauvegardes programmées** : Via les APIs

### ✅ Restauration complète
- **Restauration BDD** : Avec sauvegarde de sécurité automatique
- **Restauration uploads** : Avec option remplacement/fusion
- **Interface web** : Gestion complète via l'admin panel

### ✅ Gestion avancée
- **Liste des sauvegardes** : Avec statistiques et métadonnées
- **Organisation automatique** : Classification par type (BDD/uploads)
- **Sécurité** : Authentification service account Google

## 🔧 Configuration Google Drive

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Drive :
   - Allez dans "APIs & Services" > "Library"
   - Recherchez "Google Drive API"
   - Cliquez "Enable"

### 2. Créer un Service Account

1. Dans Google Cloud Console :
   - Allez dans "IAM & Admin" > "Service Accounts"
   - Cliquez "Create Service Account"
   - Donnez un nom : `abc-bedarieux-backup`
   - Assignez le rôle : `Editor` (ou créez un rôle custom avec accès Drive)

2. Générer la clé privée :
   - Cliquez sur le service account créé
   - Allez dans "Keys"
   - Cliquez "Add Key" > "Create new key"
   - Choisissez "JSON" et téléchargez le fichier

### 3. Configurer les variables d'environnement

Ajoutez ces variables à votre fichier `.env.local` :

```bash
# Google Drive Configuration
GOOGLE_DRIVE_CLIENT_EMAIL="abc-bedarieux-backup@your-project.iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkq...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_DRIVE_PROJECT_ID="your-project-id"
GOOGLE_DRIVE_FOLDER_ID="optional-specific-folder-id"
```

**Important** : 
- Pour `GOOGLE_DRIVE_PRIVATE_KEY`, remplacez tous les retours à la ligne par `\\n`
- Le `GOOGLE_DRIVE_FOLDER_ID` est optionnel. Si non spécifié, un dossier "ABC-Bedarieux-Backups" sera créé automatiquement

### 4. Obtenir les valeurs depuis le JSON

Depuis le fichier JSON téléchargé :
```json
{
  "type": "service_account",
  "project_id": "your-project-id",           // → GOOGLE_DRIVE_PROJECT_ID
  "client_email": "abc-bedarieux-backup@...", // → GOOGLE_DRIVE_CLIENT_EMAIL  
  "private_key": "-----BEGIN PRIVATE KEY-----\\n..." // → GOOGLE_DRIVE_PRIVATE_KEY
}
```

## 📋 Utilisation

### Interface Web (Recommandé)

1. Connectez-vous en tant qu'admin
2. Allez dans **Dashboard > Admin > Export des données**
3. Scrollez jusqu'à la section **"Google Drive - Sauvegarde Cloud"**

#### Sauvegarder :
- Cliquez "Base de données" pour sauvegarder la BDD
- Cliquez "Dossier uploads" pour sauvegarder les fichiers

#### Restaurer :
1. Cliquez "Charger la liste" pour voir les sauvegardes
2. Cliquez "Restaurer" à côté du fichier souhaité
3. Confirmez l'opération (⚠️ écrase les données existantes)

### APIs directes

```bash
# Sauvegarder la base de données
curl -X POST http://localhost:3000/api/admin/backup/google-drive/database \\
  -H "Authorization: Bearer your-session-token"

# Sauvegarder les uploads  
curl -X POST http://localhost:3000/api/admin/backup/google-drive/uploads \\
  -H "Authorization: Bearer your-session-token"

# Lister les sauvegardes
curl http://localhost:3000/api/admin/backup/google-drive/list \\
  -H "Authorization: Bearer your-session-token"

# Restaurer la base de données
curl -X POST http://localhost:3000/api/admin/restore/google-drive/database \\
  -H "Content-Type: application/json" \\
  -d '{"sqlFileId": "file-id", "confirmReplace": true}'

# Restaurer les uploads
curl -X POST http://localhost:3000/api/admin/restore/google-drive/uploads \\
  -H "Content-Type: application/json" \\
  -d '{"fileId": "file-id", "replaceExisting": true}'
```

## 🛡️ Sécurité

### Permissions Google Drive
Le service account a uniquement accès à :
- Créer des fichiers dans Drive
- Lire ses propres fichiers
- Organiser dans des dossiers spécifiques

### Sauvegarde de sécurité
- **Automatique** : Avant chaque restauration de BDD
- **Emplacement** : `backups/security-backup-before-restore-*.json`
- **Contenu** : Utilisateurs critiques + métadonnées

### Données sensibles
- Les mots de passe ne sont jamais exportés
- Les sessions utilisateur sont exclues
- Variables d'environnement non incluses

## 📊 Structure des fichiers Google Drive

```
📁 ABC-Bedarieux-Backups/
├── 📄 database-backup-2025-08-30T14-30-00-000Z.sql
├── 📄 database-metadata-2025-08-30T14-30-00-000Z.json  
├── 📦 uploads-backup-2025-08-30T14-30-00-000Z.zip
└── 📦 uploads-backup-2025-08-29T10-15-00-000Z.zip
```

### Métadonnées base de données
```json
{
  "type": "database_backup",
  "createdAt": "2025-08-30T14:30:00.000Z",
  "createdBy": "admin@abc-bedarieux.fr",
  "databaseStats": {
    "users": 150,
    "places": 45,
    "totalRecords": 2847
  },
  "method": "prisma_sql_generator",
  "version": "1.0"
}
```

### Métadonnées uploads
```json
{
  "totalFiles": 1250,
  "totalSize": 52428800,
  "createdAt": "2025-08-30T14:30:00.000Z", 
  "folders": ["newsletter", "places", "events", "users"]
}
```

## 🔧 Dépannage

### Erreur d'authentification
```bash
Error: Configuration Google Drive manquante
```
**Solution** : Vérifiez les variables d'environnement

### Erreur de permissions
```bash
Error: invalid_grant
```
**Solution** : 
1. Vérifiez que la clé privée est correcte
2. Assurez-vous que l'API Google Drive est activée
3. Vérifiez que le service account a les bonnes permissions

### Fichier non trouvé
```bash
Error: File not found on Google Drive
```
**Solution** : Le fichier a peut-être été supprimé. Rechargez la liste des sauvegardes.

### Restauration échoue
```bash
Error: Échec de la restauration
```
**Solution** : 
1. Vérifiez que le fichier SQL est valide
2. Assurez-vous que PostgreSQL/Prisma fonctionne
3. Vérifiez les logs serveur pour plus de détails

## 📝 Maintenance

### Nettoyage automatique
Actuellement, aucun nettoyage automatique n'est implémenté. Il est recommandé de :
- Supprimer manuellement les anciennes sauvegardes (>30 jours)
- Surveiller l'espace utilisé sur Google Drive
- Tester régulièrement les restaurations

### Monitoring
Les logs détaillés sont disponibles dans :
- Console serveur Next.js
- Logs Google Cloud (si activés)
- Toasts dans l'interface web

## ✅ Système de sauvegarde complet

Avec cette configuration, vous disposez maintenant d'un système de sauvegarde robuste qui :

1. **Évite la réinstallation complète** : Restauration rapide depuis Google Drive
2. **Sécurise vos données** : Sauvegarde automatique cloud
3. **Interface intuitive** : Gestion complète via l'admin panel
4. **Sauvegardes multiples** : BDD + fichiers uploads
5. **Restauration granulaire** : Choisir exactement quoi restaurer