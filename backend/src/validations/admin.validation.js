const Joi = require('joi');
const { objectId } = require('./custom.validation');

/**
 * Admin validation schemas
 */

const getUsers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string().pattern(/^[a-zA-Z]+:(asc|desc)$/),
    name: Joi.string(),
    email: Joi.string(),
    role: Joi.string(),
  }),
};

const updateUserRoles = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    roles: Joi.array()
      .items(Joi.string().valid('user', 'admin', 'editor', 'premium', 'manageBlogPosts'))
      .required(),
  }),
};

const updateApprovalStatus = {
  params: Joi.object().keys({
    postId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('published', 'rejected').required(),
    feedbackNote: Joi.string().max(1000),
  }),
};

const updateSystemSettings = {
  body: Joi.object().keys({
    settings: Joi.object({
      general: Joi.object({
        siteName: Joi.string().max(100),
        siteDescription: Joi.string().max(500),
        contactEmail: Joi.string().email(),
        defaultLanguage: Joi.string().length(2),
      }),
      seo: Joi.object({
        defaultTitle: Joi.string().max(200),
        defaultDescription: Joi.string().max(500),
        defaultKeywords: Joi.string().max(500),
        googleAnalyticsId: Joi.string().allow(''),
        facebookPixelId: Joi.string().allow(''),
      }),
      content: Joi.object({
        postsPerPage: Joi.number().integer().min(1).max(100),
        maxRelatedPosts: Joi.number().integer().min(0).max(10),
        defaultFeaturedImage: Joi.string().max(500),
        allowComments: Joi.boolean(),
      }),
      monetization: Joi.object({
        enableAffiliateLinks: Joi.boolean(),
        enableSubscriptions: Joi.boolean(),
        defaultCommission: Joi.number().min(0).max(100),
      }),
      security: Joi.object({
        enableCaptcha: Joi.boolean(),
        jwtExpiryHours: Joi.number().integer().min(1).max(168),
        maxLoginAttempts: Joi.number().integer().min(1).max(10),
      }),
    }).required(),
  }),
};

const clearCache = {
  body: Joi.object().keys({
    target: Joi.string().valid('all', 'blog', 'analytics').required(),
  }),
};

module.exports = {
  getUsers,
  updateUserRoles,
  updateApprovalStatus,
  updateSystemSettings,
  clearCache,
};
