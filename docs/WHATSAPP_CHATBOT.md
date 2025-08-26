# Chatbot WhatsApp - ABC Bédarieux

## Vue d'ensemble

Le chatbot WhatsApp d'ABC Bédarieux permet aux utilisateurs d'interagir avec la plateforme via WhatsApp pour :

- 🏢 Découvrir les établissements locaux
- 📅 Consulter les événements à venir
- 🗺️ Accéder à la carte interactive
- 📍 Obtenir des suggestions basées sur leur localisation
- ℹ️ Recevoir de l'aide et des informations

## Configuration

### 1. Prérequis WhatsApp Business API

1. **Créer une application Facebook Developer**
   - Aller sur [Facebook for Developers](https://developers.facebook.com/)
   - Créer une nouvelle application
   - Activer "WhatsApp Business API"

2. **Configuration WhatsApp Business**
   - Obtenir un numéro de téléphone WhatsApp Business
   - Configurer les permissions requises
   - Générer les tokens d'accès

### 2. Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# WhatsApp Business API Configuration
WHATSAPP_VERIFY_TOKEN=votre_token_de_verification_securise
WHATSAPP_ACCESS_TOKEN=votre_access_token_facebook
WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
WHATSAPP_WEBHOOK_SECRET=votre_webhook_secret_optionnel
```

### 3. Configuration du Webhook

1. **URL du Webhook** : `https://votre-domaine.com/api/whatsapp/webhook`
2. **Token de vérification** : Utilisez la valeur de `WHATSAPP_VERIFY_TOKEN`
3. **Événements à souscrire** :
   - `messages` - Messages entrants
   - `message_deliveries` - Status des messages
   - `message_reads` - Accusés de lecture

## Architecture

### Base de données

Le chatbot utilise 5 tables principales :

1. **`whatsapp_conversations`** - Conversations avec les utilisateurs
2. **`whatsapp_messages`** - Messages échangés
3. **`whatsapp_bot_sessions`** - Sessions conversationnelles avec contexte
4. **`whatsapp_bot_config`** - Configuration du bot
5. **`whatsapp_bot_stats`** - Statistiques d'utilisation

### API Endpoints

#### Webhook WhatsApp
- `GET /api/whatsapp/webhook` - Vérification du webhook
- `POST /api/whatsapp/webhook` - Réception des messages

#### Administration
- `GET/PUT /api/admin/whatsapp/config` - Configuration du bot
- `GET /api/admin/whatsapp/conversations` - Liste des conversations
- `GET /api/admin/whatsapp/conversations/[id]` - Messages d'une conversation
- `GET /api/admin/whatsapp/stats` - Statistiques

### Interface d'administration

Accessible via `/dashboard/admin/whatsapp` pour les administrateurs :

#### Onglets disponibles :
1. **Vue d'ensemble** - Métriques et graphiques
2. **Conversations** - Historique des conversations
3. **Configuration** - Paramètres du bot
4. **Analytiques** - Statistiques avancées

## Fonctionnalités du Bot

### Commandes principales

| Commande | Description | Exemple de réponse |
|----------|-------------|-------------------|
| `bonjour`, `salut` | Message de bienvenue | Menu principal avec options |
| `lieux`, `établissements` | Liste des établissements | Catégories d'établissements |
| `événements` | Événements à venir | Liste des 5 prochains événements |
| `carte` | Lien vers la carte | URL de la carte interactive |
| `aide`, `help` | Menu d'aide | Liste des commandes disponibles |

### Types de messages supportés

- ✅ **Texte** - Messages texte standard
- ✅ **Localisation** - Suggestions basées sur la position
- ✅ **Images** - Réception d'images
- ✅ **Audio** - Messages vocaux
- ✅ **Vidéos** - Contenu vidéo
- ✅ **Documents** - Fichiers partagés
- ✅ **Contacts** - Partage de contacts

### Flux conversationnels

#### 1. Recherche d'établissements
```
Utilisateur: "lieux"
Bot: Menu des catégories (Restaurants, Commerces, etc.)
Utilisateur: "1" ou "restaurants"
Bot: Liste des restaurants avec détails
```

#### 2. Événements
```
Utilisateur: "événements"
Bot: Liste des 5 prochains événements
Utilisateur: "2"
Bot: Détails de l'événement #2
```

#### 3. Localisation
```
Utilisateur: [Partage sa position]
Bot: Établissements dans un rayon de 5km
```

## Configuration avancée

### Messages personnalisés

Dans l'interface admin, vous pouvez personnaliser :

- **Message de bienvenue**
- **Messages d'erreur**
- **Messages de maintenance**
- **Réponses par défaut**

### Paramètres de session

- **Timeout** : Durée de vie des sessions (défaut : 1 heure)
- **Limite de messages** : Messages max par heure par utilisateur
- **Types de flux** : Activation/désactivation des fonctionnalités

## Monitoring et Analytics

### Métriques disponibles

1. **Conversations**
   - Total conversations
   - Conversations actives
   - Nouveaux utilisateurs

2. **Messages**
   - Volume par jour/heure
   - Types de messages
   - Temps de réponse moyen

3. **Engagement**
   - Requêtes les plus fréquentes
   - Flux les plus utilisés
   - Taux de complétion des conversations

### Graphiques

- **Messages par jour** - Évolution temporelle
- **Types de messages** - Répartition par type
- **Top requêtes** - Mots-clés les plus recherchés

## Développement

### Ajouter de nouvelles fonctionnalités

1. **Nouveau flux conversationnel** :
```typescript
// Dans webhook/route.ts
if (lowerContent.includes("nouveau_mot_cle")) {
  return "Réponse pour la nouvelle fonctionnalité";
}
```

2. **Nouveau type de message** :
```typescript
// Ajouter dans l'enum WhatsAppMessageType
enum WhatsAppMessageType {
  // ... existants
  NOUVEAU_TYPE
}
```

3. **Nouvelle métrique** :
```sql
-- Ajouter colonne dans whatsapp_bot_stats
ALTER TABLE whatsapp_bot_stats ADD COLUMN nouvelle_metrique INT DEFAULT 0;
```

### Tests

Pour tester le chatbot en développement :

1. Utiliser un numéro WhatsApp Business de test
2. Configurer ngrok pour exposer localhost
3. Utiliser des webhooks de test Facebook

## Sécurité

### Bonnes pratiques

- ✅ Validation des signatures webhook
- ✅ Rate limiting par utilisateur
- ✅ Sanitization des inputs
- ✅ Logging des erreurs sans exposer les données sensibles
- ✅ Tokens stockés comme variables d'environnement

### Permissions

- **Admins** : Accès complet à la configuration
- **Modérateurs** : Lecture seule des conversations
- **Utilisateurs** : Pas d'accès à l'interface admin

## Déploiement

### Production

1. Configurer les variables d'environnement
2. Migrer la base de données
3. Configurer le webhook WhatsApp
4. Activer le bot dans l'interface admin

### Monitoring

- Surveiller les logs d'erreur
- Vérifier les métriques quotidiennes
- Valider la connectivité webhook

## Support

### FAQ

**Q: Le bot ne répond pas**
R: Vérifiez que :
- Les variables d'environnement sont correctes
- Le webhook est configuré
- Le bot est activé dans l'interface admin

**Q: Messages non reçus**
R: Vérifiez :
- La signature du webhook
- Les permissions de l'application Facebook
- Les quotas de l'API WhatsApp

**Q: Statistiques incorrectes**
R: Les stats se mettent à jour en temps réel, vérifiez :
- La connexion base de données
- Les triggers de mise à jour

### Logs utiles

```bash
# Vérifier les webhooks
tail -f logs/whatsapp-webhook.log

# Monitorer les erreurs
grep ERROR logs/application.log | grep whatsapp

# Stats de performance
grep "WhatsApp" logs/performance.log
```

## Roadmap

### Fonctionnalités futures

- 🚀 **Intelligence artificielle** - Intégration GPT pour des réponses plus naturelles
- 🔄 **Multi-langues** - Support français/anglais/espagnol
- 📊 **Analytics avancées** - Tableaux de bord personnalisés
- 🤖 **Automatisation** - Réponses basées sur des triggers
- 💬 **Chat humain** - Escalade vers des agents humains
- 📱 **Rich media** - Envoi d'images, carousels, boutons

### Améliorations techniques

- Performance : Cache Redis pour les sessions
- Scalabilité : Queue system pour les messages
- Monitoring : Intégration avec des outils de monitoring
- Tests : Suite de tests automatisés