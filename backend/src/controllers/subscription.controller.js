const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');
const stripe = require('../config/stripe');
const config = require('../config/config');
const analyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');

/**
 * Subscription Controller for managing Stripe-based billing
 */

/**
 * Get all available subscription plans
 * @route GET /v1/subscriptions/plans
 * @access Public
 */
const getSubscriptionPlans = catchAsync(async (_req, res) => {
  const plans = [
    {
      id: config.stripe.monthlyPlanId,
      name: 'Monthly Premium',
      description: 'Unlimited access to all premium content',
      price: 9.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Full access to premium articles',
        'Early access to new content',
        'Ad-free reading experience',
        'Monthly newsletter',
      ],
    },
    {
      id: config.stripe.yearlyPlanId,
      name: 'Annual Premium',
      description: 'Save 20% with annual billing',
      price: 95.88,
      currency: 'USD',
      interval: 'year',
      features: [
        'Full access to premium articles',
        'Early access to new content',
        'Ad-free reading experience',
        'Monthly newsletter',
        'Exclusive webinars',
        '24/7 Priority support',
      ],
    },
  ];

  res.status(httpStatus.OK).json(plans);
});

/**
 * Create checkout session for subscription
 * @route POST /v1/subscriptions/checkout-session
 * @access Private
 */
const createCheckoutSession = catchAsync(async (req, res) => {
  const { planId, successUrl, cancelUrl } = req.body;
  const userId = req.user.id;

  // Verify plan exists
  if (planId !== config.stripe.monthlyPlanId && planId !== config.stripe.yearlyPlanId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid plan selected');
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user already has an active subscription
  if (user.subscription && user.subscription.status === 'active') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You already have an active subscription');
  }

  // Create or get Stripe customer
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    // Create a new customer in Stripe
    const customer = await stripe.createCustomer({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
      },
    });

    customerId = customer.id;

    // Save Stripe customer ID in user profile
    user.stripeCustomerId = customerId;
    await user.save();
  }

  // Create checkout session
  const checkoutSession = await stripe.createCheckoutSession({
    customerId,
    priceId: planId,
    successUrl:
      successUrl || `${config.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: cancelUrl || `${config.frontendUrl}/subscription/cancel`,
  });

  // Track event for analytics
  await analyticsService.trackEvent('subscription_checkout_initiated', {
    userId,
    planId,
    sessionId: checkoutSession.id,
  });

  res.status(httpStatus.OK).json({
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
  });
});

/**
 * Get subscription details for current user
 * @route GET /v1/subscriptions/my-subscription
 * @access Private
 */
const getUserSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get user with subscription info
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // If user has Stripe customer ID and subscription ID, get latest details
  if (user.stripeCustomerId && user.subscription && user.subscription.subscriptionId) {
    try {
      // Get latest subscription details from Stripe
      const subscriptionDetails = await stripe.getSubscription(user.subscription.subscriptionId);

      // Update subscription status in db if it has changed
      if (subscriptionDetails.status !== user.subscription.status) {
        user.subscription.status = subscriptionDetails.status;
        await user.save();
      }

      return res.status(httpStatus.OK).json({
        subscription: {
          planId: user.subscription.planId,
          status: user.subscription.status,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionDetails.cancel_at_period_end,
        },
        hasActiveSubscription: user.subscription.status === 'active',
      });
    } catch (error) {
      logger.error('Error fetching subscription from Stripe:', error);
    }
  }

  // Return empty subscription info if no subscription found
  res.status(httpStatus.OK).json({
    subscription: null,
    hasActiveSubscription: false,
  });
});

/**
 * Cancel subscription for current user
 * @route POST /v1/subscriptions/cancel
 * @access Private
 */
const cancelSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { cancelImmediately = false } = req.body;

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user has an active subscription
  if (!user.subscription || !user.subscription.subscriptionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No active subscription found');
  }

  // Cancel subscription in Stripe
  const subscriptionId = user.subscription.subscriptionId;
  await stripe.cancelSubscription(subscriptionId, !cancelImmediately);

  // Update user's subscription status
  user.subscription.status = cancelImmediately ? 'canceled' : 'active';
  user.subscription.cancelAtPeriodEnd = !cancelImmediately;
  await user.save();

  // Track cancellation event
  await analyticsService.trackEvent('subscription_canceled', {
    userId,
    subscriptionId,
    cancelImmediately,
    reason: req.body.reason || 'Not specified',
  });

  res.status(httpStatus.OK).json({
    message: cancelImmediately
      ? 'Subscription canceled immediately'
      : 'Subscription will be canceled at the end of the billing period',
    subscription: {
      status: user.subscription.status,
      cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
    },
  });
});

/**
 * Handle Stripe webhook events
 * @route POST /v1/subscriptions/webhook
 * @access Public (secured by Stripe signature)
 */
const handleStripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Stripe signature');
  }

  try {
    const event = stripe.constructEventFromPayload(signature, req.body);

    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        // Unexpected event type
        logger.error(`Unhandled event type: ${event.type}`);
    }

    res.status(httpStatus.OK).json({ received: true });
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, `Webhook error: ${err.message}`);
  }
});

/**
 * Get customer portal session URL
 * @route POST /v1/subscriptions/portal-session
 * @access Private
 */
const createPortalSession = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { returnUrl } = req.body;

  // Get user
  const user = await User.findById(userId);
  if (!user || !user.stripeCustomerId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found or no Stripe customer associated');
  }

  // Create customer portal session
  const portalSession = await stripe.createCustomerPortalSession(
    user.stripeCustomerId,
    returnUrl || `${config.frontendUrl}/account`,
  );

  res.status(httpStatus.OK).json({
    url: portalSession.url,
  });
});

/**
 * Handler for checkout.session.completed webhook event
 * @private
 */
async function handleCheckoutSessionCompleted(session) {
  // Extract the subscription ID from the session
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  if (!subscriptionId) {
    logger.error('No subscription ID found in checkout session');
    return;
  }

  try {
    // Get subscription details
    const subscription = await stripe.getSubscription(subscriptionId);

    // Find user by Stripe customer ID
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      logger.error('No user found with Stripe customer ID:', customerId);
      return;
    }

    // Update user with subscription info
    user.subscription = {
      subscriptionId,
      planId: subscription.items.data[0].price.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    // Add premium role to user if not already present
    if (!user.roles.includes('premium')) {
      user.roles.push('premium');
    }

    await user.save();

    // Track subscription event for analytics
    await analyticsService.trackEvent('subscription_created', {
      userId: user.id,
      subscriptionId,
      planId: user.subscription.planId,
      status: subscription.status,
    });
  } catch (error) {
    logger.error('Error handling checkout session completion:', error);
  }
}

/**
 * Handler for customer.subscription.updated webhook event
 * @private
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    // Find user by subscription ID
    const user = await User.findOne({ 'subscription.subscriptionId': subscription.id });
    if (!user) {
      return;
    }

    // Update user subscription info
    user.subscription.status = subscription.status;
    user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;

    // If plan ID changed, update that too
    if (subscription.items.data[0].price.id !== user.subscription.planId) {
      user.subscription.planId = subscription.items.data[0].price.id;
    }

    // Handle subscription status
    if (subscription.status === 'active') {
      // Ensure user has premium role
      if (!user.roles.includes('premium')) {
        user.roles.push('premium');
      }
    } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
      // Remove premium role if subscription is inactive
      user.roles = user.roles.filter((role) => role !== 'premium');
    }

    await user.save();

    // Track subscription event
    await analyticsService.trackEvent('subscription_updated', {
      userId: user.id,
      subscriptionId: subscription.id,
      planId: user.subscription.planId,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    logger.error('Error handling subscription update:', error);
  }
}

/**
 * Handler for customer.subscription.deleted webhook event
 * @private
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    // Find user by subscription ID
    const user = await User.findOne({ 'subscription.subscriptionId': subscription.id });
    if (!user) {
      logger.error('No user found with subscription ID:', subscription.id);
      return;
    }

    // Update user subscription status
    user.subscription.status = 'canceled';

    // Remove premium role
    user.roles = user.roles.filter((role) => role !== 'premium');

    await user.save();

    // Track subscription cancellation
    await analyticsService.trackEvent('subscription_deleted', {
      userId: user.id,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    logger.error('Error handling subscription deletion:', error);
  }
}

/**
 * Handler for invoice.payment_succeeded webhook event
 * @private
 */
async function handleInvoicePaymentSucceeded(invoice) {
  if (!invoice.subscription) {
    return; // Not subscription related
  }

  try {
    // Find user by subscription ID
    const user = await User.findOne({ 'subscription.subscriptionId': invoice.subscription });
    if (!user) {
      logger.error('No user found with subscription ID:', invoice.subscription);
      return;
    }

    // Track payment
    await analyticsService.trackEvent('subscription_payment_succeeded', {
      userId: user.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
    });
  } catch (error) {
    logger.error('Error handling invoice payment success:', error);
  }
}

/**
 * Handler for invoice.payment_failed webhook event
 * @private
 */
async function handleInvoicePaymentFailed(invoice) {
  if (!invoice.subscription) {
    return; // Not subscription related
  }

  try {
    // Find user by subscription ID
    const user = await User.findOne({ 'subscription.subscriptionId': invoice.subscription });
    if (!user) {
      logger.error('No user found with subscription ID:', invoice.subscription);
      return;
    }

    // Track failed payment
    await analyticsService.trackEvent('subscription_payment_failed', {
      userId: user.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency,
      failureMessage: invoice.last_payment_error?.message || 'Payment failed',
    });
  } catch (error) {
    logger.error('Error handling invoice payment failure:', error);
  }
}

/**
 * Reactivate a canceled subscription
 * @route POST /v1/subscriptions/reactivate
 * @access Private
 */
const reactivateSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user has a subscription
  if (!user.subscription || !user.subscription.subscriptionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No subscription found to reactivate');
  }

  // Check if subscription is set to cancel at period end
  if (!user.subscription.cancelAtPeriodEnd) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subscription is not scheduled for cancellation');
  }

  // Reactivate the subscription
  await stripe.subscriptions.update(user.subscription.subscriptionId, {});

  // Update user record
  user.subscription.cancelAtPeriodEnd = false;
  await user.save();

  // Track event
  await analyticsService.trackEvent('subscription_reactivated', {
    userId,
    subscriptionId: user.subscription.subscriptionId,
  });

  res.status(httpStatus.OK).json({
    message: 'Subscription successfully reactivated',
    subscription: {
      status: user.subscription.status,
      cancelAtPeriodEnd: false,
    },
  });
});

/**
 * Get upcoming invoice for current user's subscription
 * @route GET /v1/subscriptions/upcoming-invoice
 * @access Private
 */
const getUpcomingInvoice = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.stripeCustomerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No customer ID found');
  }

  // Get upcoming invoice
  const invoice = await stripe.getUpcomingInvoice(
    user.stripeCustomerId,
    user.subscription?.subscriptionId,
  );

  res.status(httpStatus.OK).json({
    invoice: {
      amount_due: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency,
      period_start: new Date(invoice.period_start * 1000),
      period_end: new Date(invoice.period_end * 1000),
      next_payment_attempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000)
        : null,
    },
  });
});

/**
 * Get payment methods for current user
 * @route GET /v1/subscriptions/payment-methods
 * @access Private
 */
const getPaymentMethods = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.stripeCustomerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No customer ID found');
  }

  // Get payment methods
  const paymentMethods = await stripe.getPaymentMethods(user.stripeCustomerId);

  res.status(httpStatus.OK).json({
    payment_methods: paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      exp_month: pm.card.exp_month,
      exp_year: pm.card.exp_year,
      is_default: pm.id === user.subscription?.defaultPaymentMethodId,
    })),
  });
});

/**
 * Get invoice history for current user
 * @route GET /v1/subscriptions/invoices
 * @access Private
 */
const getInvoiceHistory = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.stripeCustomerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No customer ID found');
  }

  // Get invoices
  const invoices = await stripe.getInvoices(user.stripeCustomerId);

  res.status(httpStatus.OK).json({
    invoices: invoices.data.map((invoice) => ({
      id: invoice.id,
      amount_paid: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: invoice.status,
      created: new Date(invoice.created * 1000),
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    })),
  });
});

/**
 * Apply a discount coupon to the user's subscription
 * @route POST /v1/subscriptions/apply-discount
 * @access Private
 */
const applyDiscount = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { couponId } = req.body;

  if (!couponId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon ID is required');
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.stripeCustomerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No customer ID found');
  }

  // Apply discount
  const result = await stripe.customers.update(user.stripeCustomerId, { coupon: couponId });

  // Track event
  await analyticsService.trackEvent('discount_applied', {
    userId,
    couponId,
  });

  res.status(httpStatus.OK).json({
    message: 'Discount applied successfully',
    discount: {
      coupon: result.discount?.coupon?.id,
      percent_off: result.discount?.coupon?.percent_off,
      amount_off: result.discount?.coupon?.amount_off,
      currency: result.discount?.coupon?.currency,
    },
  });
});

/**
 * Update subscription plan (upgrade/downgrade)
 * @route PUT /v1/subscriptions/update
 * @access Private
 */
const updateSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { newPlanId } = req.body;

  if (!newPlanId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'New plan ID is required');
  }

  // Verify plan exists
  if (newPlanId !== config.stripe.monthlyPlanId && newPlanId !== config.stripe.yearlyPlanId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid plan selected');
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user has a subscription
  if (!user.subscription || !user.subscription.subscriptionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No active subscription found');
  }

  // Check if user is trying to switch to the same plan
  if (user.subscription.planId === newPlanId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Already subscribed to this plan');
  }

  // Update the subscription
  const updatedSubscription = await stripe.updateSubscription(
    user.subscription.subscriptionId,
    newPlanId,
  );

  // Update user record
  user.subscription.planId = newPlanId;
  await user.save();

  // Track event
  await analyticsService.trackEvent('subscription_plan_changed', {
    userId,
    oldPlanId: user.subscription.planId,
    newPlanId,
  });

  res.status(httpStatus.OK).json({
    message: 'Subscription plan updated successfully',
    subscription: {
      planId: newPlanId,
      status: updatedSubscription.status,
      current_period_end: new Date(updatedSubscription.current_period_end * 1000),
    },
  });
});

module.exports = {
  getSubscriptionPlans,
  createCheckoutSession,
  getUserSubscription,
  cancelSubscription,
  reactivateSubscription,
  handleStripeWebhook,
  createPortalSession,
  getUpcomingInvoice,
  getPaymentMethods,
  getInvoiceHistory,
  applyDiscount,
  updateSubscription,
};
