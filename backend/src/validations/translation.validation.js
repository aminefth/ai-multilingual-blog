const Joi = require('joi');
const { objectId } = require('./custom.validation');

/**
 * Translation validation schemas
 */

const getNamespaces = {
  query: Joi.object().keys({
    language: Joi.string().valid('en', 'fr', 'de', 'es'),
  }),
};

const translateContent = {
  body: Joi.object().keys({
    content: Joi.string().required().min(10),
    title: Joi.string().required().min(3).max(200),
    sourceLanguage: Joi.string().valid('en', 'fr', 'de', 'es').required(),
    targetLanguage: Joi.string().valid('en', 'fr', 'de', 'es').required(),
  }),
};

const getTranslationStatus = {
  params: Joi.object().keys({
    postId: Joi.string().custom(objectId).required(),
  }),
};

const updateTranslations = {
  params: Joi.object().keys({
    language: Joi.string().valid('en', 'fr', 'de', 'es').required(),
  }),
  body: Joi.object().keys({
    namespace: Joi.string().default('common'),
    translations: Joi.object().required(),
  }),
};

module.exports = {
  getNamespaces,
  translateContent,
  getTranslationStatus,
  updateTranslations,
};
