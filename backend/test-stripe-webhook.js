#!/usr/bin/env node

/**
 * 🧪 Script de Test Webhooks Stripe
 *
 * Ce script teste la configuration des webhooks Stripe avec vérification de signature
 * Usage: node test-stripe-webhook.js
 */

const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// Configuration
const WEBHOOK_URL = 'http://localhost:3001/v1/webhooks/stripe';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

// Événement de test Stripe
const testEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'sub_test_subscription',
      object: 'subscription',
      customer: 'cus_test_customer',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 jours
      items: {
        data: [
          {
            id: 'si_test_item',
            price: {
              id: 'price_test_basic',
              nickname: 'Basic Plan',
            },
          },
        ],
      },
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_request',
    idempotency_key: null,
  },
  type: 'customer.subscription.created',
};

/**
 * Génère une signature Stripe valide
 */
function generateStripeSignature(payload, secret, timestamp) {
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;

  // Stripe utilise HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', secret.replace('whsec_', ''))
    .update(signedPayload, 'utf8')
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

/**
 * Teste le webhook avec signature valide
 */
async function testValidWebhook() {
  console.log('🧪 Test 1: Webhook avec signature valide');

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateStripeSignature(testEvent, WEBHOOK_SECRET, timestamp);

  try {
    const response = await axios.post(WEBHOOK_URL, testEvent, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature,
      },
    });

    console.log('✅ Succès:', response.status, response.data);
    return true;
  } catch (error) {
    console.log('❌ Échec:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

/**
 * Teste le webhook avec signature invalide
 */
async function testInvalidWebhook() {
  console.log('\n🧪 Test 2: Webhook avec signature invalide');

  const timestamp = Math.floor(Date.now() / 1000);
  const invalidSignature = `t=${timestamp},v1=invalid_signature`;

  try {
    const response = await axios.post(WEBHOOK_URL, testEvent, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': invalidSignature,
      },
    });

    console.log('❌ Problème: Le webhook a accepté une signature invalide!');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Succès: Signature invalide correctement rejetée');
      return true;
    } else {
      console.log(
        '❌ Erreur inattendue:',
        error.response?.status,
        error.response?.data || error.message,
      );
      return false;
    }
  }
}

/**
 * Teste le webhook sans signature
 */
async function testNoSignature() {
  console.log('\n🧪 Test 3: Webhook sans signature');

  try {
    const response = await axios.post(WEBHOOK_URL, testEvent, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('❌ Problème: Le webhook a accepté une requête sans signature!');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Succès: Requête sans signature correctement rejetée');
      return true;
    } else {
      console.log(
        '❌ Erreur inattendue:',
        error.response?.status,
        error.response?.data || error.message,
      );
      return false;
    }
  }
}

/**
 * Teste différents types d'événements
 */
async function testDifferentEvents() {
  console.log("\n🧪 Test 4: Différents types d'événements");

  const events = [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'checkout.session.completed',
  ];

  let successCount = 0;

  for (const eventType of events) {
    const event = { ...testEvent, type: eventType };
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateStripeSignature(event, WEBHOOK_SECRET, timestamp);

    try {
      const response = await axios.post(WEBHOOK_URL, event, {
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': signature,
        },
      });

      console.log(`  ✅ ${eventType}: ${response.status}`);
      successCount++;
    } catch (error) {
      console.log(
        `  ❌ ${eventType}: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
      );
    }
  }

  console.log(`\n📊 Résultat: ${successCount}/${events.length} événements traités avec succès`);
  return successCount === events.length;
}

/**
 * Vérifie la configuration
 */
function checkConfiguration() {
  console.log('🔍 Vérification de la configuration...\n');

  console.log('📍 URL Webhook:', WEBHOOK_URL);
  console.log('🔑 Secret Webhook:', WEBHOOK_SECRET ? '✅ Configuré' : '❌ Manquant');

  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'whsec_test_secret') {
    console.log('⚠️  Attention: Utilisation du secret de test par défaut');
    console.log('   Configurez STRIPE_WEBHOOK_SECRET dans votre fichier .env');
  }

  console.log('');
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Test des Webhooks Stripe - AI Tools Blog\n');

  checkConfiguration();

  // Vérifier que le serveur est démarré
  try {
    await axios.get('http://localhost:3001/health');
  } catch (error) {
    console.log("❌ Erreur: Le serveur backend n'est pas démarré sur le port 3001");
    console.log("   Lancez d'abord: npm run dev");
    process.exit(1);
  }

  const results = [];

  // Exécuter tous les tests
  results.push(await testValidWebhook());
  results.push(await testInvalidWebhook());
  results.push(await testNoSignature());
  results.push(await testDifferentEvents());

  // Résumé final
  const successCount = results.filter(Boolean).length;
  const totalTests = results.length;

  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(50));
  console.log(`✅ Tests réussis: ${successCount}/${totalTests}`);

  if (successCount === totalTests) {
    console.log('🎉 Tous les tests sont passés! Votre configuration webhook est correcte.');
  } else {
    console.log('⚠️  Certains tests ont échoué. Vérifiez votre configuration.');
  }

  console.log('\n💡 Conseils:');
  console.log('   - Assurez-vous que STRIPE_WEBHOOK_SECRET est configuré dans .env');
  console.log('   - Vérifiez que le serveur backend est démarré');
  console.log('   - Consultez les logs du serveur pour plus de détails');

  process.exit(successCount === totalTests ? 0 : 1);
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

// Lancer les tests
if (require.main === module) {
  main();
}

module.exports = {
  generateStripeSignature,
  testValidWebhook,
  testInvalidWebhook,
  testNoSignature,
};
