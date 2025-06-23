const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const aiService = require('./ai.service');
const { BlogPost } = require('../models');
const logger = require('../utils/logger');

/**
 * Create a new blog post
 * @param {Object} postData - Blog post data
 * @returns {Promise<BlogPost>}
 */
const createPost = async (postData) => {
  // Generate slug if not provided
  if (!postData.slug && postData.title) {
    postData.slug = generateSlug(postData.title);
  }

  // Calculate reading time if content is provided
  if (postData.content) {
    postData.readingTime = calculateReadingTime(postData.content);
  }

  // Create the post
  const post = await BlogPost.create(postData);

  return post;
};

/**
 * Query for blog posts
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page
 * @param {number} [options.page] - Current page (default = 1)
 * @param {string} [options.language] - Language for content localization
 * @returns {Promise<QueryResult>}
 */
const getPosts = async (filter, options = {}) => {
  const { sortBy = 'publishedAt:desc', limit = 10, page = 1, language = 'en' } = options;

  const skip = (page - 1) * limit;

  // Build query
  const query = { ...filter };

  // Filter by published status if not explicitly provided
  if (!filter.status) {
    query.status = 'published';
  }

  const posts = await BlogPost.find(query)
    .populate('author', 'name email avatar')
    .populate('category', 'name slug')
    .sort(parseSortBy(sortBy))
    .skip(skip)
    .limit(limit);

  const total = await BlogPost.countDocuments(query);

  // Localize posts based on requested language
  const results = posts.map((post) => localizePost(post, language));

  return {
    results,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  };
};

/**
 * Get post by id
 * @param {ObjectId} id - Post id
 * @param {string} language - Preferred language
 * @returns {Promise<BlogPost>}
 */
const getPostById = async (id, language = 'en') => {
  const post = await BlogPost.findById(id)
    .populate('author', 'name email avatar')
    .populate('category', 'name slug');

  if (!post) {
    return null;
  }

  return localizePost(post, language);
};

/**
 * Get post by slug
 * @param {string} slug - Post slug
 * @param {string} language - Preferred language
 * @returns {Promise<BlogPost>}
 */
const getPostBySlug = async (slug, language = 'en') => {
  // Try to find by original slug or translated slug
  const post = await BlogPost.findOne({
    $or: [{ slug }, { [`translations.${language}.slug`]: slug }],
  })
    .populate('author', 'name email avatar')
    .populate('category', 'name slug');

  if (!post) {
    return null;
  }

  return localizePost(post, language);
};

/**
 * Update post by id
 * @param {ObjectId} postId - Post id
 * @param {Object} updateBody - Update body
 * @param {ObjectId} userId - User id (for authorization)
 * @returns {Promise<BlogPost>}
 */
const updatePost = async (postId, updateBody, userId) => {
  const post = await BlogPost.findById(postId);

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  // Check if user is authorized (is author or has admin rights)
  if (post.author.toString() !== userId) {
    // Check if user has admin rights would be done at the middleware level
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to update this post');
  }

  // Update slug if title is being updated
  if (updateBody.title && !updateBody.slug) {
    updateBody.slug = generateSlug(updateBody.title);
  }

  // Update reading time if content is being updated
  if (updateBody.content) {
    updateBody.readingTime = calculateReadingTime(updateBody.content);
  }

  // Set publishedAt date if status is being changed to published
  if (updateBody.status === 'published' && post.status !== 'published') {
    updateBody.publishedAt = new Date();
  }

  Object.assign(post, updateBody);
  await post.save();

  return post;
};

/**
 * Delete post by id
 * @param {ObjectId} postId - Post id
 * @param {ObjectId} userId - User id (for authorization)
 * @returns {Promise<BlogPost>}
 */
const deletePost = async (postId, userId) => {
  const post = await BlogPost.findById(postId);

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  // Check if user is authorized (is author or has admin rights)
  if (post.author.toString() !== userId) {
    // Check if user has admin rights would be done at the middleware level
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to delete this post');
  }

  // Soft delete (change status to archived)
  post.status = 'archived';
  await post.save();

  return post;
};

/**
 * Translate post content to target languages
 * @param {ObjectId} postId - Post id
 * @param {Array<string>} targetLanguages - Languages to translate to
 * @returns {Promise<Object>} - Translated content by language
 */
const translatePost = async (postId, targetLanguages = ['en', 'fr', 'de', 'es']) => {
  const post = await BlogPost.findById(postId);

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  // Determine source language - default to 'en' if not set
  const sourceLanguage = post.language || 'en';

  // Filter out source language from target languages
  const languages = targetLanguages.filter((lang) => lang !== sourceLanguage);

  if (languages.length === 0) {
    return { message: 'No languages to translate to' };
  }

  const translations = {};
  const errors = {};

  for (const lang of languages) {
    try {
      // Use OpenAI to translate content
      const translated = await aiService.translateContent(
        post.content,
        post.title,
        sourceLanguage,
        lang,
      );

      // Generate slug for the translated title
      const translatedSlug = generateSlug(translated.title);

      // Store translations in the format expected by the model
      translations[lang] = {
        title: translated.title,
        content: translated.content,
        excerpt: translated.excerpt || post.excerpt,
        slug: translatedSlug,
      };
    } catch (error) {
      logger.error(`Translation failed for ${lang}:`, error);
      errors[lang] = error.message;
    }
  }

  // Update post with new translations
  if (Object.keys(translations).length > 0) {
    post.translations = { ...post.translations, ...translations };
    await post.save();
  }

  return {
    translations,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

/**
 * Increment post view count
 * @param {ObjectId} postId - Post id
 * @param {Boolean} isUnique - Whether this is a unique view
 */
const incrementViews = async (postId, isUnique = false) => {
  const update = { $inc: { views: 1 } };
  if (isUnique) {
    update.$inc.uniqueViews = 1;
  }

  await BlogPost.findByIdAndUpdate(postId, update);
};

/**
 * Track affiliate link click
 * @param {ObjectId} postId - Post id
 * @param {Number} linkIndex - Index of the affiliate link
 * @returns {Promise<Object>} - Updated affiliate link data
 */
const trackAffiliateClick = async (postId, linkIndex) => {
  const post = await BlogPost.findById(postId);

  if (!post || !post.affiliateLinks || !post.affiliateLinks[linkIndex]) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post or affiliate link not found');
  }

  // Increment click count
  post.affiliateLinks[linkIndex].clicks += 1;
  await post.save();

  // Calculate conversion rate
  const conversionRate =
    (post.affiliateLinks[linkIndex].conversions / post.affiliateLinks[linkIndex].clicks) * 100;

  return {
    ...post.affiliateLinks[linkIndex].toObject(),
    conversionRate: parseFloat(conversionRate.toFixed(2)),
  };
};

/**
 * Generate SEO-friendly slug from title
 * @param {string} title - Post title
 * @returns {string} - Generated slug
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[àáäâãå]/g, 'a')
    .replace(/[èéëê]/g, 'e')
    .replace(/[ìíïî]/g, 'i')
    .replace(/[òóöô]/g, 'o')
    .replace(/[ùúüû]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
};

/**
 * Calculate reading time in minutes
 * @param {string} content - Post content
 * @returns {number} - Reading time in minutes
 */
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

/**
 * Parse sortBy string to mongo sort object
 * @param {string} sortBy - Sort string in format field:order
 * @returns {Object} - Mongo sort object
 */
const parseSortBy = (sortBy) => {
  const parts = sortBy.split(':');
  const field = parts[0];
  const order = parts[1] === 'desc' ? -1 : 1;
  return { [field]: order };
};

/**
 * Localize post content based on language
 * @param {Object} post - Blog post document
 * @param {string} language - Target language
 * @returns {Object} - Localized post
 */
const localizePost = (post, language) => {
  if (post.language === language) {
    return post;
  }

  if (post.translations && post.translations[language]) {
    const translation = post.translations[language];
    const postObject = post.toObject ? post.toObject() : post;

    return {
      ...postObject,
      title: translation.title || postObject.title,
      content: translation.content || postObject.content,
      excerpt: translation.excerpt || postObject.excerpt,
      slug: translation.slug || postObject.slug,
      language,
    };
  }

  return post;
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
  translatePost,
  incrementViews,
  trackAffiliateClick,
};
