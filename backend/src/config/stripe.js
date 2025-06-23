const Stripe = require('stripe');
const config = require('./config');
const logger = require('../utils/logger');

const stripe = Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'AI Tools Blog',
    version: '1.0.0',
  },
});

/**
 * Create a checkout session for a subscription
 * @param {String} customerId - Stripe customer ID
 * @param {String} priceId - Stripe price ID
 * @param {String} successUrl - Success URL
 * @param {String} cancelUrl - Cancel URL
 * @returns {Promise<Object>} - Checkout session
 */
const createCheckoutSession = async (customerId, priceId, successUrl, cancelUrl) => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
    });

    return session;
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Get subscription details
 * @param {String} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} - Subscription details
 */
const getSubscription = async (subscriptionId) => {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'items.data.price'],
    });
  } catch (error) {
    logger.error('Error retrieving Stripe subscription:', error);
    throw error;
  }
};

/**
 * Get customer details
 * @param {String} customerId - Stripe customer ID
 * @returns {Promise<Object>} - Customer details
 */
const getCustomer = async (customerId) => {
  try {
    return await stripe.customers.retrieve(customerId);
  } catch (error) {
    logger.error('Error retrieving Stripe customer:', error);
    throw error;
  }
};

/**
 * Update subscription (upgrade/downgrade)
 * @param {String} subscriptionId - Stripe subscription ID
 * @param {String} newPriceId - New price ID
 * @returns {Promise<Object>} - Updated subscription
 */
const updateSubscription = async (subscriptionId, newPriceId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
  } catch (error) {
    logger.error('Error updating Stripe subscription:', error);
    throw error;
  }
};

/**
 * Cancel a subscription immediately or at period end
 * @param {String} subscriptionId - Stripe subscription ID
 * @param {Boolean} atPeriodEnd - Whether to cancel at period end (default: true)
 * @returns {Promise<Object>} - Updated/canceled subscription
 */
const cancelSubscription = async (subscriptionId, atPeriodEnd = true) => {
  try {
    if (atPeriodEnd) {
      // Cancel at the end of the current billing period
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancel immediately
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  } catch (error) {
    logger.error('Error canceling Stripe subscription:', error);
    throw error;
  }
};

/**
 * Reactivate a subscription that was set to cancel
 * @param {String} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} - Reactivated subscription
 */
const reactivateSubscription = async (subscriptionId) => {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  } catch (error) {
    logger.error('Error reactivating Stripe subscription:', error);
    throw error;
  }
};

/**
 * Create customer portal session
 * @param {String} customerId - Stripe customer ID
 * @param {String} returnUrl - Return URL after portal session
 * @returns {Promise<Object>} - Portal session
 */
const createCustomerPortalSession = async (customerId, returnUrl) => {
  try {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  } catch (error) {
    logger.error('Error creating customer portal session:', error);
    throw error;
  }
};

/**
 * Construct event from webhook payload
 * @param {String|Buffer} payload - Raw request body
 * @param {String} signature - Stripe-Signature header
 * @returns {Object} - Event object
 */
const constructEventFromPayload = (payload, signature) => {
  try {
    return stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    throw error;
  }
};

/**
 * Create a usage record for metered billing
 * @param {String} subscriptionItemId - Subscription item ID
 * @param {Number} quantity - Usage quantity
 * @param {String} action - Usage action ('increment' or 'set')
 * @returns {Promise<Object>} - Usage record
 */
const createUsageRecord = async (subscriptionItemId, quantity, action = 'increment') => {
  try {
    return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      action,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    logger.error('Error creating usage record:', error);
    throw error;
  }
};

/**
 * Get upcoming invoice for a customer
 * @param {String} customerId - Stripe customer ID
 * @param {String} subscriptionId - Optional subscription ID
 * @returns {Promise<Object>} - Upcoming invoice
 */
const getUpcomingInvoice = async (customerId, subscriptionId = null) => {
  try {
    const params = { customer: customerId };
    if (subscriptionId) {
      params.subscription = subscriptionId;
    }

    return await stripe.invoices.retrieveUpcoming(params);
  } catch (error) {
    logger.error('Error retrieving upcoming invoice:', error);
    throw error;
  }
};

/**
 * Get payment methods for a customer
 * @param {String} customerId - Stripe customer ID
 * @param {String} type - Payment method type (default: 'card')
 * @returns {Promise<Object>} - Payment methods
 */
const getPaymentMethods = async (customerId, type = 'card') => {
  try {
    return await stripe.paymentMethods.list({
      customer: customerId,
      type,
    });
  } catch (error) {
    logger.error('Error retrieving payment methods:', error);
    throw error;
  }
};

/**
 * Create a discount for a customer (coupon)
 * @param {String} customerId - Stripe customer ID
 * @param {String} couponId - Coupon ID
 * @returns {Promise<Object>} - Updated customer with discount
 */
const applyDiscount = async (customerId, couponId) => {
  try {
    return await stripe.customers.update(customerId, {
      coupon: couponId,
    });
  } catch (error) {
    logger.error('Error applying discount:', error);
    throw error;
  }
};

/**
 * Get invoice list for a customer
 * @param {String} customerId - Stripe customer ID
 * @param {Number} limit - Number of invoices to retrieve (default: 10)
 * @returns {Promise<Object>} - Invoice list
 */
const getInvoices = async (customerId, limit = 10) => {
  try {
    return await stripe.invoices.list({
      customer: customerId,
      limit,
      status: 'paid',
    });
  } catch (error) {
    logger.error('Error retrieving invoices:', error);
    throw error;
  }
};

module.exports = {
  stripe,
  createCheckoutSession,
  getSubscription,
  getCustomer,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  createCustomerPortalSession,
  constructEventFromPayload,
  createUsageRecord,
  getUpcomingInvoice,
  getPaymentMethods,
  applyDiscount,
  getInvoices,

  // Backward compatibility
  constructEventFromWebhook: constructEventFromPayload,
};
