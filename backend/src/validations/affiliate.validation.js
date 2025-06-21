const Joi = require('joi');
const { objectId } = require('./custom.validation');

/**
 * Affiliate validation schemas
 */

const trackAffiliateClick = {
  body: Joi.object().keys({
    postId: Joi.string().required().custom(objectId),
    linkIndex: Joi.number().integer().min(0).required(),
    redirectUrl: Joi.string().uri(),
  }),
};

const registerConversion = {
  body: Joi.object().keys({
    postId: Joi.string().required().custom(objectId),
    linkIndex: Joi.number().integer().min(0).required(),
    revenue: Joi.number().min(0),
    customerId: Joi.string(),
  }),
};

const addAffiliateLink = {
  body: Joi.object().keys({
    postId: Joi.string().required().custom(objectId),
    link: Joi.object().keys({
      text: Joi.string().required().max(500),
      url: Joi.string().required().uri(),
      tool: Joi.string().required().max(100),
      commission: Joi.number().min(0).max(100),
    }).required(),
  }),
};

const getAffiliateReport = {
  query: Joi.object().keys({
    period: Joi.string().pattern(/^(\d+)([dwmy])$/).default('30d'),
    tool: Joi.string().max(100),
  }),
};

module.exports = {
  trackAffiliateClick,
  registerConversion,
  addAffiliateLink,
  getAffiliateReport,
};
