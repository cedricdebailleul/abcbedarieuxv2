# 🚀 Quick Start - Sécuriser vos uploads MAINTENANT

## ⚡ Solution immédiate (5 minutes)

### 1. Redémarrer avec le volume Docker

```bash
# Arrêter les conteneurs
docker-compose down

# Copier vos images existantes dans le volume (si besoin)
docker volume create uploads_data
docker run --rm -v uploads_data:/target -v $(pwd)/uploads:/source alpine cp -r /source/. /target/

# Redémarrer avec la nouvelle config
docker-compose up -d --build
```

**Résultat:** ✅ Vos images persistent maintenant entre les redémarrages!

---

## 🔄 Tester que ça fonctionne

```bash
# 1. Vérifier que le volume existe
docker volume ls | grep uploads_data

# 2. Uploader une image via l'admin
#    → Créer/éditer un commerce
#    → Upload un logo

# 3. Redémarrer le serveur
docker-compose restart app

# 4. Vérifier que l'image est toujours là
#    → Recharger la page du commerce
#    → L'image doit s'afficher ✅
```

---

## 📋 État actuel

```
STORAGE_PROVIDER=local (par défaut)
```

**Ce qui fonctionne:**
- ✅ Upload d'images
- ✅ Stockage dans `/app/uploads` (volume Docker)
- ✅ Persistance entre redémarrages
- ✅ Aucune dépendance externe

**Limitations:**
- ⚠️ Pas de backup automatique
- ⚠️ Perte si le serveur crashe complètement
- ⚠️ Pas de CDN global

---

## 🎯 Prochaine étape (optionnel - sous 1h)

Pour sécuriser davantage avec Cloudflare R2 (gratuit):

1. **Lire:** [STORAGE_MIGRATION.md](./STORAGE_MIGRATION.md)
2. **Créer:** Compte Cloudflare + Bucket R2
3. **Configurer:** Variables d'environnement
4. **Passer en mode hybrid:** `STORAGE_PROVIDER=hybrid`

**Avantage du mode hybrid:**
- Images stockées localement (rapide) ✅
- Backup automatique vers R2 (sécurité) ✅
- 0€ jusqu'à 10GB ✅
- CDN global gratuit ✅

---

## 💡 Commandes utiles

```bash
# Voir l'espace utilisé par les uploads
docker exec abcv2_app du -sh /app/uploads

# Lister le contenu du volume
docker run --rm -v uploads_data:/data alpine ls -lah /data

# Backup manuel du volume
docker run --rm -v uploads_data:/source -v $(pwd)/backups:/backup alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /source .

# Restaurer un backup
docker run --rm -v uploads_data:/target -v $(pwd)/backups:/backup alpine tar xzf /backup/uploads-YYYYMMDD.tar.gz -C /target
```

---

## 🆘 Problème?

**Images cassées après redémarrage:**
```bash
# Vérifier que le volume est monté
docker inspect abcv2_app | grep -A 10 Mounts

# Vérifier les permissions
docker exec abcv2_app ls -la /app/uploads
```

**Espace disque plein:**
```bash
# Nettoyer les volumes inutilisés
docker volume prune

# Voir l'utilisation disque
df -h
```

---

## ✅ Vous êtes prêt!

Vos images sont maintenant sécurisées avec le volume Docker.

Pour aller plus loin (R2), consultez [STORAGE_MIGRATION.md](./STORAGE_MIGRATION.md).
