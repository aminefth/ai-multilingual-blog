const request = require('supertest');
const crypto = require('crypto');
const httpStatus = require('http-status');
const app = require('../../../src/app');
const setupTestDB = require('../../utils/setupTestDB');
const { User } = require('../../../src/models');
const { userOne, insertUsers } = require('../../fixtures/user.fixture');

// Mock Stripe configuration and webhook secret
jest.mock('../../../src/config/config', () => ({
  ...jest.requireActual('../../../src/config/config'),
  stripe: {
    webhookSecret: 'whsec_test_secret',
    apiKey: 'sk_test_key',
  },
}));

const createStripeSignature = (payload, secret) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
};

setupTestDB();

describe('Stripe Webhooks', () => {
  beforeEach(async () => {
    await insertUsers([userOne]);
  });

  describe('POST /webhooks/stripe', () => {
    test('should handle subscription.created event', async () => {
      // Create webhook payload for subscription creation
      const subscriptionId = 'sub_test123';
      const payload = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: subscriptionId,
            customer: 'cus_test123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
            items: {
              data: [
                {
                  price: {
                    id: 'price_premium_monthly',
                    product: 'prod_premium',
                  },
                },
              ],
            },
            metadata: {
              userId: userOne._id.toString(),
            },
          },
        },
      };

      // Create webhook signature
      const signature = createStripeSignature(payload, 'whsec_test_secret');

      // Send webhook request
      const res = await request(app)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(httpStatus.OK);

      // Check if user subscription was updated
      const updatedUser = await User.findById(userOne._id);
      expect(updatedUser.subscription).toBeDefined();
      expect(updatedUser.subscription.status).toBe('active');
      expect(updatedUser.subscription.id).toBe(subscriptionId);
      expect(updatedUser.subscription.plan).toBe('premium');
    });

    test('should handle subscription.updated event', async () => {
      // First set up user with a subscription
      await User.findByIdAndUpdate(userOne._id, {
        subscription: {
          id: 'sub_old123',
          status: 'active',
          plan: 'basic',
          currentPeriodEnd: new Date(),
        },
      });

      // Create webhook payload for subscription update
      const subscriptionId = 'sub_old123';
      const newPeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      
      const payload = {
        id: 'evt_update123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: subscriptionId,
            customer: 'cus_test123',
            status: 'active',
            current_period_end: newPeriodEnd,
            items: {
              data: [
                {
                  price: {
                    id: 'price_premium_yearly',
                    product: 'prod_premium',
                  },
                },
              ],
            },
            metadata: {
              userId: userOne._id.toString(),
            },
          },
        },
      };

      // Create webhook signature
      const signature = createStripeSignature(payload, 'whsec_test_secret');

      // Send webhook request
      const res = await request(app)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(httpStatus.OK);

      // Check if user subscription was updated
      const updatedUser = await User.findById(userOne._id);
      expect(updatedUser.subscription).toBeDefined();
      expect(updatedUser.subscription.id).toBe(subscriptionId);
      expect(updatedUser.subscription.currentPeriodEnd).toEqual(new Date(newPeriodEnd * 1000));
    });

    test('should handle subscription.deleted event', async () => {
      // First set up user with a subscription
      await User.findByIdAndUpdate(userOne._id, {
        subscription: {
          id: 'sub_delete123',
          status: 'active',
          plan: 'premium',
          currentPeriodEnd: new Date(),
        },
      });

      // Create webhook payload for subscription deletion
      const payload = {
        id: 'evt_delete123',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_delete123',
            customer: 'cus_test123',
            status: 'canceled',
            metadata: {
              userId: userOne._id.toString(),
            },
          },
        },
      };

      // Create webhook signature
      const signature = createStripeSignature(payload, 'whsec_test_secret');

      // Send webhook request
      const res = await request(app)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(httpStatus.OK);

      // Check if user subscription was updated
      const updatedUser = await User.findById(userOne._id);
      expect(updatedUser.subscription.status).toBe('canceled');
    });

    test('should reject requests with invalid signatures', async () => {
      const payload = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.created',
      };

      // Create invalid signature
      const invalidSignature = 'invalid_signature';

      // Send webhook request with invalid signature
      const res = await request(app)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', invalidSignature)
        .send(payload)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
