const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createPost = {
  body: Joi.object().keys({
    title: Joi.string().required().min(10).max(200),
    content: Joi.string().min(100),
    excerpt: Joi.string().max(300),
    slug: Joi.string(), // Optional, will be auto-generated if not provided
    category: Joi.string().required().custom(objectId),
    tags: Joi.array().items(Joi.string()).max(10),
    isPremium: Joi.boolean().default(false),
    isPublished: Joi.boolean().default(false),
    language: Joi.string().valid('en', 'fr', 'de', 'es').default('fr'),
    featuredImage: Joi.string().uri(),
    status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
    publishedAt: Joi.date(),
    affiliateLinks: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().required(),
          url: Joi.string().uri().required(),
          tool: Joi.string().required(),
          commission: Joi.number().min(0),
          clicks: Joi.number().default(0),
          conversions: Joi.number().default(0),
          revenue: Joi.number().default(0),
        }),
      )
      .max(10),
    metaTitle: Joi.string().max(60),
    metaDescription: Joi.string().max(160),
    keywords: Joi.array().items(Joi.string()).max(10),
    useAI: Joi.boolean().default(false), // Flag to use AI for content generation
    generateSEO: Joi.boolean().default(false), // Flag to auto-generate SEO data
    topic: Joi.string(), // Topic for AI content generation
    tone: Joi.string()
      .valid('professional', 'casual', 'formal', 'persuasive')
      .default('professional'),
    wordCount: Joi.number().min(300).max(5000).default(1500), // For AI-generated content
  }),
};

const getPosts = {
  query: Joi.object().keys({
    category: Joi.string().custom(objectId),
    tags: Joi.array().items(Joi.string()),
    author: Joi.string().custom(objectId),
    isPremium: Joi.boolean(),
    status: Joi.string().valid('draft', 'published', 'archived'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    language: Joi.string().valid('en', 'fr', 'de', 'es'),
  }),
};

const getPost = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    language: Joi.string().valid('en', 'fr', 'de', 'es'),
  }),
};

const getPostBySlug = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
  query: Joi.object().keys({
    language: Joi.string().valid('en', 'fr', 'de', 'es'),
  }),
};

const updatePost = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().min(10).max(200),
      content: Joi.string().min(100),
      excerpt: Joi.string().max(300),
      slug: Joi.string(),
      category: Joi.string().custom(objectId),
      tags: Joi.array().items(Joi.string()).max(10),
      isPremium: Joi.boolean(),
      isPublished: Joi.boolean(),
      language: Joi.string().valid('en', 'fr', 'de', 'es'),
      featuredImage: Joi.string().uri(),
      status: Joi.string().valid('draft', 'published', 'archived'),
      publishedAt: Joi.date(),
      affiliateLinks: Joi.array()
        .items(
          Joi.object({
            text: Joi.string().required(),
            url: Joi.string().uri().required(),
            tool: Joi.string().required(),
            commission: Joi.number().min(0),
            clicks: Joi.number(),
            conversions: Joi.number(),
            revenue: Joi.number(),
          }),
        )
        .max(10),
      metaTitle: Joi.string().max(60),
      metaDescription: Joi.string().max(160),
      keywords: Joi.array().items(Joi.string()).max(10),
    })
    .min(1),
};

const deletePost = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const translatePost = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    targetLanguages: Joi.array()
      .items(Joi.string().valid('en', 'fr', 'de', 'es'))
      .min(1)
      .required(),
  }),
};

const updateSEO = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const trackAffiliateClick = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    linkIndex: Joi.number().min(0).required(),
  }),
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  getPostBySlug,
  updatePost,
  deletePost,
  translatePost,
  updateSEO,
  trackAffiliateClick,
};
