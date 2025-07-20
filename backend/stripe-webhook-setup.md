# 🔔 Guide Configuration Webhooks Stripe

## 🎯 **OBJECTIF**
Configurer les webhooks Stripe pour recevoir automatiquement les événements de paiement (abonnements, factures, échecs de paiement, etc.) avec une sécurité maximale.

## 📋 **ÉTAPES DE CONFIGURATION**

### **1. Accéder au Dashboard Stripe**
- 🌐 **URL** : https://dashboard.stripe.com/test/webhooks
- 🔐 **Connexion** : Utilise ton compte Stripe

### **2. Créer un Nouveau Webhook**
```
Cliquer sur "Add endpoint" ou "Ajouter un endpoint"
```

### **3. Configuration de l'Endpoint**
```bash
# URL de ton webhook (développement local)
Endpoint URL: http://localhost:3001/v1/webhooks/stripe

# Pour la production (remplace par ton domaine)
Endpoint URL: https://ton-domaine.com/v1/webhooks/stripe
```

### **4. Sélectionner les Événements Importants**
Cocher ces événements essentiels :

#### **💳 Abonnements**
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated` 
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`

#### **💰 Paiements**
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `invoice.created`
- ✅ `invoice.finalized`

#### **👤 Clients**
- ✅ `customer.created`
- ✅ `customer.updated`
- ✅ `customer.deleted`

#### **🔄 Checkout**
- ✅ `checkout.session.completed`
- ✅ `checkout.session.expired`

### **5. Récupérer le Secret Webhook**
Après création, copier le secret webhook :
```bash
# Format : whsec_1234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_ton_secret_webhook_ici
```

## 🛡️ **SÉCURITÉ WEBHOOK DÉJÀ IMPLÉMENTÉE**

### **Vérification Automatique des Signatures**
Notre middleware vérifie automatiquement :
- ✅ **Signature HMAC** : Authentification cryptographique
- ✅ **Timestamp** : Protection contre les attaques de replay
- ✅ **Payload intégrité** : Vérification que les données n'ont pas été modifiées

### **Code de Sécurité (Déjà implémenté)**
```javascript
// Dans src/middlewares/webhookSignature.middleware.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Vérification automatique de la signature
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body, 
  sig, 
  process.env.STRIPE_WEBHOOK_SECRET
);
```

## 🎯 **ÉVÉNEMENTS GÉRÉS PAR TON BACKEND**

### **Route Webhook Stripe**
```bash
POST /v1/webhooks/stripe
```

### **Événements Traités Automatiquement**
1. **Nouvel Abonnement** → Mise à jour base de données utilisateur
2. **Paiement Réussi** → Activation des fonctionnalités premium
3. **Paiement Échoué** → Notification utilisateur + retry
4. **Annulation Abonnement** → Désactivation fonctionnalités premium
5. **Fin d'Essai** → Notification avant expiration

## 🧪 **TESTER LES WEBHOOKS**

### **1. Utiliser Stripe CLI (Recommandé)**
```bash
# Installation
npm install -g stripe-cli

# Login
stripe login

# Redirection des webhooks vers ton serveur local
stripe listen --forward-to localhost:3001/v1/webhooks/stripe

# Dans un autre terminal, déclencher des événements test
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### **2. Tester depuis le Dashboard**
- 📍 **URL** : https://dashboard.stripe.com/test/webhooks
- 🎯 **Action** : Cliquer sur "Send test webhook"
- 📊 **Vérification** : Voir les logs dans ton backend

## 📊 **MONITORING DES WEBHOOKS**

### **Logs Backend**
```bash
# Voir les webhooks reçus
tail -f logs/app.log | grep webhook

# Vérifier les erreurs
tail -f logs/error.log | grep stripe
```

### **Dashboard Stripe**
- 📈 **Succès/Échecs** : Statistiques en temps réel
- 🔍 **Détails** : Payload et réponses pour chaque webhook
- 🔄 **Retry** : Possibilité de renvoyer les webhooks échoués

## 🚨 **GESTION D'ERREURS**

### **Retry Automatique Stripe**
- 🔄 **Tentatives** : Stripe retry automatiquement les webhooks échoués
- ⏱️ **Délais** : 1h, 6h, 24h, puis abandon
- 📧 **Notifications** : Email si échec persistant

### **Gestion dans ton Code**
```javascript
// Déjà implémenté dans webhook.route.js
try {
  // Traitement de l'événement
  await handleStripeEvent(event);
  res.status(200).json({ received: true });
} catch (error) {
  logger.error('Stripe webhook error:', error);
  res.status(400).json({ error: 'Webhook processing failed' });
}
```

## 🌐 **CONFIGURATION PRODUCTION**

### **Variables d'Environnement Production**
```bash
# Clés de production (commencent par pk_live_ et sk_live_)
STRIPE_SECRET_KEY=sk_live_votre_cle_secrete_production
STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique_production
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook_production

# URL webhook production
# https://votre-domaine.com/v1/webhooks/stripe
```

### **Sécurité Production**
- 🔒 **HTTPS Obligatoire** : Stripe n'envoie que vers HTTPS en production
- 🛡️ **Firewall** : Autoriser uniquement les IPs Stripe
- 📝 **Logs** : Monitoring complet des événements

## ✅ **CHECKLIST FINAL**

### **Configuration Stripe Dashboard**
- [ ] Webhook endpoint créé
- [ ] Événements sélectionnés
- [ ] Secret webhook copié dans .env
- [ ] Test webhook envoyé avec succès

### **Configuration Backend**
- [ ] STRIPE_WEBHOOK_SECRET dans .env
- [ ] Route /v1/webhooks/stripe fonctionnelle
- [ ] Middleware de vérification activé
- [ ] Logs webhook visibles

### **Tests Fonctionnels**
- [ ] Création d'abonnement test
- [ ] Réception webhook subscription.created
- [ ] Paiement test réussi
- [ ] Réception webhook invoice.payment_succeeded

## 🆘 **DÉPANNAGE**

### **Problèmes Courants**
1. **Webhook 400/500** → Vérifier le secret webhook
2. **Signature invalide** → Vérifier STRIPE_WEBHOOK_SECRET
3. **Timeout** → Optimiser le traitement des événements
4. **Duplicatas** → Implémenter l'idempotence (déjà fait)

### **Debug**
```bash
# Activer les logs détaillés
DEBUG_MODE=true
LOG_LEVEL=debug

# Vérifier la configuration
curl -X POST http://localhost:3001/v1/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

🎉 **Avec cette configuration, ton système de paiement Stripe est sécurisé et production-ready !**
