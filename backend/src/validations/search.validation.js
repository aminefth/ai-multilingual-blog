const Joi = require('joi');

const search = {
  query: Joi.object().keys({
    q: Joi.string().required().min(1).max(200),
    limit: Joi.number().integer().min(1).max(50).default(20),
    offset: Joi.number().integer().min(0).default(0),
    language: Joi.string().valid('en', 'fr', 'es', 'de', 'ar').optional(),
    category: Joi.string().optional(),
    tags: Joi.string().optional(),
    sort: Joi.string().valid('publishedAt:desc', 'publishedAt:asc', 'views:desc', 'likes:desc').default('publishedAt:desc'),
    isPremium: Joi.boolean().optional(),
  }),
};

const suggestions = {
  query: Joi.object().keys({
    q: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(10).default(5),
    language: Joi.string().valid('en', 'fr', 'es', 'de', 'ar').optional(),
  }),
};

const searchCategories = {
  query: Joi.object().keys({
    q: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(20).default(10),
    language: Joi.string().valid('en', 'fr', 'es', 'de', 'ar').optional(),
  }),
};

const reindex = {
  body: Joi.object().keys({
    type: Joi.string().valid('posts', 'categories', 'all').required(),
  }),
};

module.exports = {
  search,
  suggestions,
  searchCategories,
  reindex,
};
