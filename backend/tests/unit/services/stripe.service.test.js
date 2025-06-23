const httpStatus = require('http-status');
const moment = require('moment');
const { stripe } = require('../../../src/config/stripe');
const stripeService = require('../../../src/services/stripe.service');
const userService = require('../../../src/services/user.service');
const ApiError = require('../../../src/utils/ApiError');
const config = require('../../../src/config/config');
const { User } = require('../../../src/models');
const mongoose = require('mongoose');

// Mock des dépendances
jest.mock('../../../src/config/stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    products: {
      list: jest.fn(),
    },
    prices: {
      list: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.mock('../../../src/services/user.service');
jest.mock('../../../src/models/user.model');

describe('Stripe service', () => {
  let mockUserId;
  let mockUser;
  let mockCustomerId;
  let mockSubscriptionId;
  let mockPriceId;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = new mongoose.Types.ObjectId();
    mockCustomerId = 'cus_test123456789';
    mockSubscriptionId = 'sub_test123456789';
    mockPriceId = 'price_test123456789';

    mockUser = {
      _id: mockUserId,
      email: 'test@example.com',
      name: 'Test User',
      stripeCustomerId: mockCustomerId,
      subscription: {
        id: mockSubscriptionId,
        status: 'active',
        plan: 'premium',
        currentPeriodEnd: moment().add(30, 'days').toDate(),
      },
    };
  });

  describe('createCustomer', () => {
    test('should create a Stripe customer and return the customer ID', async () => {
      // Arrange
      const customerData = {
        name: mockUser.name,
        email: mockUser.email,
        metadata: { userId: mockUserId.toString() },
      };

      const stripeCustomerResponse = {
        id: mockCustomerId,
        name: customerData.name,
        email: customerData.email,
      };

      stripe.customers.create.mockResolvedValue(stripeCustomerResponse);

      // Act
      const result = await stripeService.createCustomer(customerData);

      // Assert
      expect(stripe.customers.create).toHaveBeenCalledWith(customerData);
      expect(result).toEqual(stripeCustomerResponse);
      expect(result.id).toBe(mockCustomerId);
    });

    test('should handle case when customer creation fails', async () => {
      // Arrange
      const customerData = {
        name: mockUser.name,
        email: mockUser.email,
      };

      const errorMsg = 'Failed to create customer';
      stripe.customers.create.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(stripeService.createCustomer(customerData)).rejects.toThrow(ApiError);
      await expect(stripeService.createCustomer(customerData)).rejects.toThrow(errorMsg);
    });

    test('should handle required fields validation', async () => {
      // Arrange
      const incompleteData = {
        name: 'Test User',
        // email missing
      };

      // Act & Assert
      await expect(stripeService.createCustomer(incompleteData)).rejects.toThrow(ApiError);
    });
  });

  describe('getCustomer', () => {
    test('should retrieve a customer by ID', async () => {
      // Arrange
      const stripeCustomerResponse = {
        id: mockCustomerId,
        name: mockUser.name,
        email: mockUser.email,
      };

      stripe.customers.retrieve.mockResolvedValue(stripeCustomerResponse);

      // Act
      const result = await stripeService.getCustomer(mockCustomerId);

      // Assert
      expect(stripe.customers.retrieve).toHaveBeenCalledWith(mockCustomerId);
      expect(result).toEqual(stripeCustomerResponse);
    });

    test('should throw error when customer is not found', async () => {
      // Arrange
      stripe.customers.retrieve.mockRejectedValue({
        type: 'StripeInvalidRequestError',
        message: 'No such customer',
      });

      // Act & Assert
      await expect(stripeService.getCustomer('invalid_id')).rejects.toThrow(ApiError);
    });

    test('should handle null or undefined customer ID', async () => {
      // Act & Assert
      await expect(stripeService.getCustomer(null)).rejects.toThrow(ApiError);
      await expect(stripeService.getCustomer(undefined)).rejects.toThrow(ApiError);
    });
  });

  describe('createSubscription', () => {
    test('should create a subscription successfully', async () => {
      // Arrange
      const subscriptionData = {
        customer: mockCustomerId,
        items: [{ price: mockPriceId }],
        metadata: { userId: mockUserId.toString() },
      };

      const stripeSubscriptionResponse = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          data: [
            {
              price: {
                id: mockPriceId,
                product: 'prod_premium',
              },
            },
          ],
        },
      };

      stripe.subscriptions.create.mockResolvedValue(stripeSubscriptionResponse);

      // Act
      const result = await stripeService.createSubscription(subscriptionData);

      // Assert
      expect(stripe.subscriptions.create).toHaveBeenCalledWith({
        ...subscriptionData,
        expand: ['latest_invoice.payment_intent'],
      });
      expect(result).toEqual(stripeSubscriptionResponse);
    });

    test('should handle case when subscription creation fails', async () => {
      // Arrange
      const subscriptionData = {
        customer: mockCustomerId,
        items: [{ price: mockPriceId }],
      };

      const errorMsg = 'Failed to create subscription';
      stripe.subscriptions.create.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(stripeService.createSubscription(subscriptionData)).rejects.toThrow(ApiError);
    });
  });

  describe('cancelSubscription', () => {
    test('should cancel subscription successfully', async () => {
      // Arrange
      const canceledSubscription = {
        id: mockSubscriptionId,
        status: 'canceled',
      };

      stripe.subscriptions.cancel.mockResolvedValue(canceledSubscription);

      // Act
      const result = await stripeService.cancelSubscription(mockSubscriptionId);

      // Assert
      expect(stripe.subscriptions.cancel).toHaveBeenCalledWith(mockSubscriptionId);
      expect(result).toEqual(canceledSubscription);
      expect(result.status).toBe('canceled');
    });

    test('should throw error when subscription is not found', async () => {
      // Arrange
      stripe.subscriptions.cancel.mockRejectedValue({
        type: 'StripeInvalidRequestError',
        message: 'No such subscription',
      });

      // Act & Assert
      await expect(stripeService.cancelSubscription('invalid_id')).rejects.toThrow(ApiError);
    });
  });

  describe('createCheckoutSession', () => {
    test('should create checkout session successfully', async () => {
      // Arrange
      const sessionData = {
        customer: mockCustomerId,
        line_items: [
          {
            price: mockPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      };

      const mockSession = {
        id: 'cs_test123456789',
        url: 'https://checkout.stripe.com/test123',
      };

      stripe.checkout.sessions.create.mockResolvedValue(mockSession);

      // Act
      const result = await stripeService.createCheckoutSession(sessionData);

      // Assert
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(sessionData);
      expect(result).toEqual(mockSession);
      expect(result.url).toBe('https://checkout.stripe.com/test123');
    });

    test('should throw error when checkout session creation fails', async () => {
      // Arrange
      const sessionData = {
        customer: mockCustomerId,
        line_items: [
          {
            price: mockPriceId,
            quantity: 1,
          },
        ],
      };

      const errorMsg = 'Failed to create checkout session';
      stripe.checkout.sessions.create.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(stripeService.createCheckoutSession(sessionData)).rejects.toThrow(ApiError);
    });

    test('should require success_url and cancel_url', async () => {
      // Arrange
      const incompleteData = {
        customer: mockCustomerId,
        line_items: [{ price: mockPriceId, quantity: 1 }],
        mode: 'subscription',
        // missing success_url and cancel_url
      };

      // Act & Assert
      await expect(stripeService.createCheckoutSession(incompleteData)).rejects.toThrow(ApiError);
    });
  });

  describe('getSubscriptionPlans', () => {
    test('should return all available subscription plans', async () => {
      // Arrange
      const mockProducts = {
        data: [
          {
            id: 'prod_basic',
            name: 'Basic Plan',
            description: 'Basic subscription',
            active: true,
          },
          {
            id: 'prod_premium',
            name: 'Premium Plan',
            description: 'Premium subscription',
            active: true,
          },
          {
            id: 'prod_inactive',
            name: 'Inactive Plan',
            active: false,
          },
        ],
      };

      const mockPrices = {
        data: [
          {
            id: 'price_basic_monthly',
            product: 'prod_basic',
            unit_amount: 999,
            currency: 'usd',
            recurring: { interval: 'month' },
          },
          {
            id: 'price_premium_monthly',
            product: 'prod_premium',
            unit_amount: 1999,
            currency: 'usd',
            recurring: { interval: 'month' },
          },
          {
            id: 'price_premium_yearly',
            product: 'prod_premium',
            unit_amount: 19990,
            currency: 'usd',
            recurring: { interval: 'year' },
          },
        ],
      };

      stripe.products.list.mockResolvedValue(mockProducts);
      stripe.prices.list.mockResolvedValue(mockPrices);

      // Act
      const result = await stripeService.getSubscriptionPlans();

      // Assert
      expect(stripe.products.list).toHaveBeenCalledWith({ active: true });
      expect(stripe.prices.list).toHaveBeenCalledWith({ active: true });
      expect(result).toHaveLength(2); // Only active products

      // Check that the plans have the correct structure
      expect(result.find((p) => p.id === 'prod_basic')).toEqual(
        expect.objectContaining({
          id: 'prod_basic',
          name: 'Basic Plan',
          prices: expect.arrayContaining([
            expect.objectContaining({
              id: 'price_basic_monthly',
              interval: 'month',
              amount: 999,
            }),
          ]),
        }),
      );

      // Check premium plan has both monthly and yearly prices
      const premiumPlan = result.find((p) => p.id === 'prod_premium');
      expect(premiumPlan.prices).toHaveLength(2);
      expect(premiumPlan.prices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'price_premium_monthly' }),
          expect.objectContaining({ id: 'price_premium_yearly' }),
        ]),
      );
    });

    test('should handle case when no products are available', async () => {
      // Arrange
      stripe.products.list.mockResolvedValue({ data: [] });
      stripe.prices.list.mockResolvedValue({ data: [] });

      // Act
      const result = await stripeService.getSubscriptionPlans();

      // Assert
      expect(result).toEqual([]);
    });

    test('should handle Stripe API errors', async () => {
      // Arrange
      const errorMsg = 'Failed to fetch products';
      stripe.products.list.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(stripeService.getSubscriptionPlans()).rejects.toThrow(ApiError);
    });
  });

  describe('handleSubscriptionEvent', () => {
    test('should handle subscription.created event', async () => {
      // Arrange
      const event = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: mockSubscriptionId,
            customer: mockCustomerId,
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
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
              userId: mockUserId.toString(),
            },
          },
        },
      };

      userService.getUserById.mockResolvedValue(mockUser);
      userService.updateUserById.mockResolvedValue(mockUser);

      // Act
      await stripeService.handleSubscriptionEvent(event);

      // Assert
      expect(userService.updateUserById).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          subscription: expect.objectContaining({
            id: mockSubscriptionId,
            status: 'active',
            plan: 'premium',
            currentPeriodEnd: expect.any(Date),
          }),
        }),
      );
    });

    test('should handle subscription.updated event', async () => {
      // Arrange
      const newPeriodEnd = Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60;
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: mockSubscriptionId,
            customer: mockCustomerId,
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
              userId: mockUserId.toString(),
            },
          },
        },
      };

      userService.getUserById.mockResolvedValue(mockUser);
      userService.updateUserById.mockResolvedValue(mockUser);

      // Act
      await stripeService.handleSubscriptionEvent(event);

      // Assert
      expect(userService.updateUserById).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          subscription: expect.objectContaining({
            id: mockSubscriptionId,
            status: 'active',
            currentPeriodEnd: new Date(newPeriodEnd * 1000),
          }),
        }),
      );
    });

    test('should handle subscription.deleted event', async () => {
      // Arrange
      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: mockSubscriptionId,
            customer: mockCustomerId,
            status: 'canceled',
            metadata: {
              userId: mockUserId.toString(),
            },
          },
        },
      };

      userService.getUserById.mockResolvedValue(mockUser);
      userService.updateUserById.mockResolvedValue(mockUser);

      // Act
      await stripeService.handleSubscriptionEvent(event);

      // Assert
      expect(userService.updateUserById).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          subscription: expect.objectContaining({
            status: 'canceled',
          }),
        }),
      );
    });

    test('should throw error if user is not found', async () => {
      // Arrange
      const event = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: mockSubscriptionId,
            customer: mockCustomerId,
            metadata: {
              userId: mockUserId.toString(),
            },
          },
        },
      };

      userService.getUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(stripeService.handleSubscriptionEvent(event)).rejects.toThrow(ApiError);
    });

    test('should handle missing userId metadata', async () => {
      // Arrange
      const event = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: mockSubscriptionId,
            customer: mockCustomerId,
            metadata: {
              /* no userId */
            },
          },
        },
      };

      // Need to find the user by customer ID instead
      User.findOne.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockUser),
      }));

      userService.getUserById.mockResolvedValue(mockUser);
      userService.updateUserById.mockResolvedValue(mockUser);

      // Act
      await stripeService.handleSubscriptionEvent(event);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ stripeCustomerId: mockCustomerId });
    });
  });

  describe('verifyWebhookEvent', () => {
    test('should verify webhook event signature correctly', async () => {
      // Arrange
      const payload = JSON.stringify({ type: 'test.event' });
      const signature = 'test_signature';
      const mockEvent = { type: 'test.event' };

      stripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      // Act
      const result = stripeService.verifyWebhookEvent(payload, signature);

      // Assert
      expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        expect.any(String), // webhookSecret from config
      );
      expect(result).toEqual(mockEvent);
    });

    test('should throw error when signature is invalid', async () => {
      // Arrange
      const payload = JSON.stringify({ type: 'test.event' });
      const signature = 'invalid_signature';

      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act & Assert
      expect(() => stripeService.verifyWebhookEvent(payload, signature)).toThrow(ApiError);
    });
  });
});
