# Configuration Rapide - Chatbot WhatsApp

## 🚀 Installation en 5 minutes

### 1. Variables d'environnement

Ajoutez ces lignes à votre `.env` :

```env
# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=mon_token_verification_123
WHATSAPP_ACCESS_TOKEN=votre_access_token_facebook
WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
WHATSAPP_WEBHOOK_SECRET=votre_secret_optionnel

# WhatsApp Button (Visible côté client)
NEXT_PUBLIC_WHATSAPP_NUMBER=33651430377
```

### 2. Migration base de données

```bash
pnpm db:generate
pnpm db:push
```

### 3. Configuration WhatsApp Business

1. **Facebook for Developers** : https://developers.facebook.com/
2. **Créer une app** → Ajouter "WhatsApp Business API"
3. **Webhook URL** : `https://votre-domaine.com/api/whatsapp/webhook`
4. **Token de vérification** : Valeur de `WHATSAPP_VERIFY_TOKEN`

### 4. Activation du bot

1. Aller sur `/dashboard/admin/whatsapp`
2. Activer le chatbot avec le switch
3. Personnaliser le message de bienvenue

## ✅ Test rapide

Envoyez "bonjour" au numéro WhatsApp Business configuré.

Le bot devrait répondre avec le menu principal.

## 🛟 Support

- **Documentation complète** : `/docs/WHATSAPP_CHATBOT.md`
- **Interface admin** : `/dashboard/admin/whatsapp`
- **Logs** : Vérifiez la console pour les erreurs webhook

## 📱 Commandes de test

- `bonjour` → Menu principal
- `lieux` → Liste des établissements  
- `événements` → Événements à venir
- `carte` → Lien carte interactive
- `aide` → Menu d'aide

---

💡 **Astuce** : Utilisez ngrok en développement pour tester les webhooks localement.