const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const subscriptionValidation = require('../../validations/subscription.validation');
const subscriptionController = require('../../controllers/subscription.controller');
const cacheMiddleware = require('../../middlewares/cache');

const router = express.Router();

/**
 * GET /v1/subscriptions/plans
 * Get all available subscription plans
 * Public endpoint, cached for 1 day (86400 seconds)
 */
router.get('/plans', cacheMiddleware(86400), subscriptionController.getSubscriptionPlans);

/**
 * POST /v1/subscriptions/checkout-session
 * Create checkout session for subscription
 * Private endpoint (requires authentication)
 */
router.post(
  '/checkout-session',
  auth(),
  validate(subscriptionValidation.createCheckoutSession),
  subscriptionController.createCheckoutSession,
);

/**
 * GET /v1/subscriptions/my-subscription
 * Get subscription details for current user
 * Private endpoint (requires authentication)
 */
router.get('/my-subscription', auth(), subscriptionController.getUserSubscription);

/**
 * POST /v1/subscriptions/cancel
 * Cancel subscription for current user
 * Private endpoint (requires authentication)
 */
router.post(
  '/cancel',
  auth(),
  validate(subscriptionValidation.cancelSubscription),
  subscriptionController.cancelSubscription,
);

/**
 * POST /v1/subscriptions/webhook
 * Handle Stripe webhook events
 * Public endpoint secured by Stripe signature verification
 */
router.post(
  '/webhook',
  validate(subscriptionValidation.handleStripeWebhook),
  subscriptionController.handleStripeWebhook,
);

/**
 * POST /v1/subscriptions/portal-session
 * Get customer portal session URL
 * Private endpoint (requires authentication)
 */
router.post(
  '/portal-session',
  auth(),
  validate(subscriptionValidation.createPortalSession),
  subscriptionController.createPortalSession,
);

/**
 * POST /v1/subscriptions/reactivate
 * Reactivate a canceled subscription
 * Private endpoint (requires authentication)
 */
router.post('/reactivate', auth(), subscriptionController.reactivateSubscription);

/**
 * GET /v1/subscriptions/upcoming-invoice
 * Get upcoming invoice for current user's subscription
 * Private endpoint (requires authentication)
 */
router.get('/upcoming-invoice', auth(), subscriptionController.getUpcomingInvoice);

/**
 * GET /v1/subscriptions/payment-methods
 * Get payment methods for current user
 * Private endpoint (requires authentication)
 */
router.get('/payment-methods', auth(), subscriptionController.getPaymentMethods);

/**
 * GET /v1/subscriptions/invoices
 * Get invoice history for current user
 * Private endpoint (requires authentication)
 */
router.get('/invoices', auth(), subscriptionController.getInvoiceHistory);

/**
 * POST /v1/subscriptions/apply-discount
 * Apply a discount coupon to the user's subscription
 * Private endpoint (requires authentication)
 */
router.post(
  '/apply-discount',
  auth(),
  validate(subscriptionValidation.applyDiscount),
  subscriptionController.applyDiscount,
);

/**
 * PUT /v1/subscriptions/update
 * Update subscription plan (upgrade/downgrade)
 * Private endpoint (requires authentication)
 */
router.put(
  '/update',
  auth(),
  validate(subscriptionValidation.updateSubscription),
  subscriptionController.updateSubscription,
);

module.exports = router;
