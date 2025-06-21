const Joi = require('joi');

/**
 * Subscription validation schemas
 */

const createCheckoutSession = {
  body: Joi.object().keys({
    planId: Joi.string().required(),
    successUrl: Joi.string().uri(),
    cancelUrl: Joi.string().uri(),
  }),
};

const cancelSubscription = {
  body: Joi.object().keys({
    cancelImmediately: Joi.boolean().default(false),
    reason: Joi.string().max(500),
  }),
};

const createPortalSession = {
  body: Joi.object().keys({
    returnUrl: Joi.string().uri(),
  }),
};

const handleStripeWebhook = {
  body: Joi.object().required(),
};

const applyDiscount = {
  body: Joi.object().keys({
    couponId: Joi.string().required(),
  }),
};

const updateSubscription = {
  body: Joi.object().keys({
    newPlanId: Joi.string().required(),
  }),
};

// For endpoints that don't require body validation, we define empty schemas
const reactivateSubscription = {
  // No body parameters needed
};

const getUpcomingInvoice = {
  // No body parameters needed
};

const getPaymentMethods = {
  // No body parameters needed
};

const getInvoiceHistory = {
  // No body parameters needed
};

module.exports = {
  createCheckoutSession,
  cancelSubscription,
  createPortalSession,
  handleStripeWebhook,
  applyDiscount,
  updateSubscription,
  reactivateSubscription,
  getUpcomingInvoice,
  getPaymentMethods,
  getInvoiceHistory,
};
