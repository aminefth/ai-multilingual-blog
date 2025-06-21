const Joi = require('joi');

/**
 * Analytics validation schemas
 */

const trackEvent = {
  body: Joi.object().keys({
    event: Joi.string().required().max(100),
    data: Joi.object().default({}),
  }),
};

const getDashboardData = {
  query: Joi.object().keys({
    period: Joi.string().pattern(/^(\d+)([dwmy])$/).default('30d'),
  }),
};

const getContentPerformance = {
  query: Joi.object().keys({
    period: Joi.string().pattern(/^(\d+)([dwmy])$/).default('30d'),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const getRevenueMetrics = {
  query: Joi.object().keys({
    period: Joi.string().pattern(/^(\d+)([dwmy])$/).default('30d'),
  }),
};

const getUserEngagement = {
  query: Joi.object().keys({
    period: Joi.string().pattern(/^(\d+)([dwmy])$/).default('30d'),
  }),
};

module.exports = {
  trackEvent,
  getDashboardData,
  getContentPerformance,
  getRevenueMetrics,
  getUserEngagement,
};
