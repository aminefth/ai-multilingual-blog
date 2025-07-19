const express = require('express');
const { auth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const subscriptionValidation = require('../../validations/subscription.validation');
const subscriptionController = require('../../controllers/subscription.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription and payment management
 */

/**
 * @swagger
 * /subscriptions/plans:
 *   get:
 *     summary: Get subscription plans
 *     description: Retrieve available subscription plans with pricing and features for monetization
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [EUR, USD, GBP]
 *           default: EUR
 *         description: Currency for pricing display
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [month, year]
 *         description: Filter by billing interval
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter active plans only
 *     responses:
 *       "200":
 *         description: Subscription plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subscription'
 *                 currency:
 *                   type: string
 *                   example: "EUR"
 *                 totalPlans:
 *                   type: integer
 *                   example: 3
 *                 recommendations:
 *                   type: object
 *                   properties:
 *                     mostPopular:
 *                       type: string
 *                       example: "plan_premium_monthly"
 *                     bestValue:
 *                       type: string
 *                       example: "plan_premium_yearly"
 *                     starter:
 *                       type: string
 *                       example: "plan_basic_monthly"
 *       "400":
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 400
 *               message: "Invalid currency parameter"
 *
 * /subscriptions/subscribe:
 *   post:
 *     summary: Create subscription
 *     description: Create a new subscription with Stripe integration (requires authentication)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - paymentMethodId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: Stripe price ID for the subscription plan
 *                 example: "price_1234567890abcdef"
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *                 example: "pm_1234567890abcdef"
 *               couponCode:
 *                 type: string
 *                 description: Optional coupon code for discount
 *                 example: "LAUNCH50"
 *               billingAddress:
 *                 type: object
 *                 properties:
 *                   line1:
 *                     type: string
 *                     example: "123 Rue de la Paix"
 *                   city:
 *                     type: string
 *                     example: "Paris"
 *                   postal_code:
 *                     type: string
 *                     example: "75001"
 *                   country:
 *                     type: string
 *                     example: "FR"
 *               taxId:
 *                 type: string
 *                 description: VAT number for EU customers
 *                 example: "FR12345678901"
 *     responses:
 *       "201":
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *                 clientSecret:
 *                   type: string
 *                   description: Stripe client secret for payment confirmation
 *                   example: "seti_1234567890abcdef_secret_xyz"
 *                 status:
 *                   type: string
 *                   enum: [active, incomplete, incomplete_expired, trialing, past_due, canceled, unpaid]
 *                   example: "active"
 *                 nextBillingDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-02-15T10:30:00Z"
 *       "400":
 *         description: Invalid subscription data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 400
 *               message: "Invalid plan ID or payment method"
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "402":
 *         description: Payment required or failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 402
 *               message: "Payment method declined"
 *       "409":
 *         description: User already has active subscription
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 409
 *               message: "User already has an active subscription"
 *
 * /subscriptions/current:
 *   get:
 *     summary: Get current subscription
 *     description: Get the current user's subscription details and billing information
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Current subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *                 usage:
 *                   type: object
 *                   properties:
 *                     premiumArticlesRead:
 *                       type: integer
 *                       example: 15
 *                     premiumArticlesLimit:
 *                       type: integer
 *                       example: 50
 *                     aiToolsAccessed:
 *                       type: integer
 *                       example: 8
 *                     aiToolsLimit:
 *                       type: integer
 *                       example: 20
 *                 billing:
 *                   type: object
 *                   properties:
 *                     nextBillingDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-15T10:30:00Z"
 *                     amount:
 *                       type: number
 *                       format: float
 *                       example: 29.99
 *                     currency:
 *                       type: string
 *                       example: "EUR"
 *                     paymentMethod:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "card"
 *                         last4:
 *                           type: string
 *                           example: "4242"
 *                         brand:
 *                           type: string
 *                           example: "visa"
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: No active subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 404
 *               message: "No active subscription found"
 *
 *   patch:
 *     summary: Update subscription
 *     description: Update subscription plan or payment method
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *                 description: New Stripe price ID to upgrade/downgrade
 *                 example: "price_1234567890abcdef"
 *               paymentMethodId:
 *                 type: string
 *                 description: New payment method ID
 *                 example: "pm_1234567890abcdef"
 *               couponCode:
 *                 type: string
 *                 description: Coupon code for discount
 *                 example: "UPGRADE20"
 *     responses:
 *       "200":
 *         description: Subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *                 prorationAmount:
 *                   type: number
 *                   format: float
 *                   description: Proration amount for plan change
 *                   example: 15.50
 *                 effectiveDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *       "400":
 *         description: Invalid update data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: No active subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   delete:
 *     summary: Cancel subscription
 *     description: Cancel the current subscription (will remain active until end of billing period)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: immediately
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Cancel immediately vs at period end
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [too_expensive, missing_features, switching_service, other]
 *         description: Cancellation reason for analytics
 *     responses:
 *       "200":
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subscription cancelled successfully"
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *                 accessUntil:
 *                   type: string
 *                   format: date-time
 *                   description: When premium access will end
 *                   example: "2024-02-15T10:30:00Z"
 *                 refundAmount:
 *                   type: number
 *                   format: float
 *                   description: Refund amount if applicable
 *                   example: 0.00
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: No active subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /subscriptions/portal:
 *   post:
 *     summary: Create billing portal session
 *     description: Create Stripe billing portal session for subscription management
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               returnUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect after portal session
 *                 example: "https://aitools.blog/account/billing"
 *     responses:
 *       "200":
 *         description: Billing portal session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: Stripe billing portal URL
 *                   example: "https://billing.stripe.com/session/xyz123"
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T11:30:00Z"
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: No subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /subscriptions/checkout-session:
 *   post:
 *     summary: Create checkout session for subscription
 *     description: Create a new checkout session for subscription (requires authentication)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: Stripe price ID for the subscription plan
 *                 example: "price_1234567890abcdef"
 *               couponCode:
 *                 type: string
 *                 description: Optional coupon code for discount
 *                 example: "LAUNCH50"
 *     responses:
 *       "201":
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: Stripe checkout session ID
 *                   example: "cs_1234567890abcdef"
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: Stripe checkout URL
 *                   example: "https://checkout.stripe.com/pay/xyz123"
 *       "400":
 *         description: Invalid checkout session data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /subscriptions/my-subscription:
 *   get:
 *     summary: Get subscription details for current user
 *     description: Get the current user's subscription details (requires authentication)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Subscription details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: No active subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /subscriptions/cancel:
 *   post:
 *     summary: Cancel subscription for current user
 *     description: Cancel the current user's subscription (will remain active until end of billing period)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: immediately
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Cancel immediately vs at period end
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [too_expensive, missing_features, switching_service, other]
 *         description: Cancellation reason for analytics
 *     responses:
 *       "200":
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subscription cancelled successfully"
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *                 accessUntil:
 *                   type: string
 *                   format: date-time
 *                   description: When premium access will end
 *                   example: "2024-02-15T10:30:00Z"
 *                 refundAmount:
 *                   type: number
 *                   format: float
 *                   description: Refund amount if applicable
 *                   example: 0.00
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: No active subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /subscriptions/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     description: Handle Stripe webhook events for subscription management
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Stripe webhook event ID
 *                 example: "evt_1234567890abcdef"
 *               type:
 *                 type: string
 *                 description: Stripe webhook event type
 *                 example: "invoice.payment_succeeded"
 *     responses:
 *       "200":
 *         description: Webhook event handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Webhook event handled successfully"
 *       "400":
 *         description: Invalid webhook event data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /subscriptions/portal-session:
 *   post:
 *     summary: Get customer portal session URL
 *     description: Get the customer portal session URL for subscription management
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Portal session URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: Customer portal session URL
 *                   example: "https://billing.stripe.com/session/xyz123"
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: No subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /subscriptions/reactivate:
 *   post:
 *     summary: Reactivate a canceled subscription
 *     description: Reactivate a canceled subscription (requires authentication)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Subscription reactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subscription reactivated successfully"
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: No canceled subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /subscriptions/upcoming-invoice:
 *   get:
 *     summary: Get upcoming invoice for current user's subscription
 *     description: Get the upcoming invoice for the current user's subscription (requires authentication)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Upcoming invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoice:
 *                   $ref: '#/components/schemas/Invoice'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: No active subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /subscriptions/payment-methods:
 *   get:
 *     summary: Get payment methods for current user
 *     description: Get the payment methods for the current user (requires authentication)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentMethod'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /subscriptions/invoices:
 *   get:
 *     summary: Get invoice history for current user
 *     description: Get the invoice history for the current user (requires authentication)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Invoice history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /subscriptions/apply-discount:
 *   post:
 *     summary: Apply a discount coupon to the user's subscription
 *     description: Apply a discount coupon to the user's subscription (requires authentication)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *             properties:
 *               couponCode:
 *                 type: string
 *                 description: Discount coupon code
 *                 example: "LAUNCH50"
 *     responses:
 *       "200":
 *         description: Discount applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Discount applied successfully"
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       "400":
 *         description: Invalid discount coupon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /subscriptions/update:
 *   put:
 *     summary: Update subscription plan (upgrade/downgrade)
 *     description: Update the subscription plan for the current user (requires authentication)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: New Stripe price ID to upgrade/downgrade
 *                 example: "price_1234567890abcdef"
 *     responses:
 *       "200":
 *         description: Subscription plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *                 prorationAmount:
 *                   type: number
 *                   format: float
 *                   description: Proration amount for plan change
 *                   example: 15.50
 *                 effectiveDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *       "400":
 *         description: Invalid update data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

router.get('/plans', validate(subscriptionValidation.getPlans), subscriptionController.getPlans);

// Create new subscription
router.post(
  '/subscribe',
  auth('manageOwnSubscription'),
  validate(subscriptionValidation.createSubscription),
  subscriptionController.createSubscription,
);

// Get current user subscription
router.get(
  '/current',
  auth('manageOwnSubscription'),
  validate(subscriptionValidation.getCurrentSubscription),
  subscriptionController.getCurrentSubscription,
);

// Update subscription (upgrade/downgrade)
router.patch(
  '/current',
  auth('manageOwnSubscription'),
  validate(subscriptionValidation.updateSubscription),
  subscriptionController.updateSubscription,
);

// Cancel subscription
router.delete(
  '/current',
  auth('manageOwnSubscription'),
  validate(subscriptionValidation.cancelSubscription),
  subscriptionController.cancelSubscription,
);

// Create billing portal session
router.post(
  '/portal',
  auth('manageOwnSubscription'),
  validate(subscriptionValidation.createPortalSession),
  subscriptionController.createPortalSession,
);

// Create checkout session for subscription
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
