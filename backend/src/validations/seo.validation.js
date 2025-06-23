const Joi = require('joi');
const { objectId } = require('./custom.validation');

/**
 * SEO validation schemas
 */

const generateSEOMetadata = {
  params: Joi.object().keys({
    postId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    language: Joi.string().valid('en', 'fr', 'de', 'es'),
  }),
};

const updateSEOMetadata = {
  params: Joi.object().keys({
    postId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      metaTitle: Joi.string().max(60),
      metaDescription: Joi.string().max(160),
      keywords: Joi.array().items(Joi.string()),
      canonicalUrl: Joi.string().uri(),
      language: Joi.string().valid('en', 'fr', 'de', 'es'),
    })
    .min(1),
};

const getSEOMetadata = {
  params: Joi.object().keys({
    postId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    language: Joi.string().valid('en', 'fr', 'de', 'es'),
  }),
};

const updateSiteSEOSettings = {
  body: Joi.object()
    .keys({
      siteName: Joi.string().max(100),
      siteDescription: Joi.string().max(160),
      defaultOgImage: Joi.string().uri(),
      googleAnalyticsId: Joi.string(),
      googleSiteVerification: Joi.string(),
      bingSiteVerification: Joi.string(),
      robots: Joi.string(),
      structuredData: Joi.object(),
    })
    .min(1),
};

module.exports = {
  generateSEOMetadata,
  updateSEOMetadata,
  getSEOMetadata,
  updateSiteSEOSettings,
};
