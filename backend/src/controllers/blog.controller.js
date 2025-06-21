const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { blogService, aiService, analyticsService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');
const { cache } = require('../config/redis');
const i18next = require('i18next');

/**
 * Create a new blog post with optional AI assistance
 * @public
 */
const createPost = catchAsync(async (req, res) => {
  const { useAI, generateSEO, ...postData } = req.body;
  
  // Optional AI content generation
  if (useAI && postData.title && postData.keywords) {
    const generatedContent = await aiService.generateBlogContent({
      title: postData.title,
      topic: postData.topic || postData.title,
      keywords: postData.keywords,
      language: postData.language || 'en',
      wordCount: postData.wordCount || 1500,
      tone: postData.tone || 'professional'
    });
    
    postData.content = generatedContent;
  }
  
  // Create the post
  const post = await blogService.createPost({
    ...postData,
    author: req.user.id,
  });
  
  // Generate SEO metadata if requested
  if (generateSEO && post.content) {
    const seoData = await aiService.generateMetaDescription(
      post.content, 
      post.language || 'en'
    );
    
    post.metaDescription = seoData;
    await post.save();
  }
  
  // Track analytics for post creation
  analyticsService.trackEvent('post_created', {
    userId: req.user.id,
    postId: post.id,
    language: post.language,
    isPremium: post.isPremium,
    hasAffiliateLinks: post.affiliateLinks?.length > 0
  });
  
  res.status(httpStatus.CREATED).send(post);
});

/**
 * Get all blog posts with filtering, sorting and pagination
 * @public
 */
const getPosts = catchAsync(async (req, res) => {
  // Prepare filter, options and language for query
  const filter = pick(req.query, ['category', 'tags', 'status', 'author', 'isPremium']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const language = req.query.language || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
  
  // Try to get from cache first
  const cacheKey = `posts:${JSON.stringify(filter)}:${JSON.stringify(options)}:${language}`;
  const cachedResult = await cache.get(cacheKey);
  
  if (cachedResult) {
    return res.send(cachedResult);
  }
  
  // Get posts with localization
  const posts = await blogService.getPosts(filter, { ...options, language });
  
  // Cache results for 5 minutes
  await cache.set(cacheKey, posts, 300);
  
  res.send(posts);
});

/**
 * Get blog post by slug
 * @public
 */
const getPostBySlug = catchAsync(async (req, res) => {
  // Extract language from request or use default
  const language = req.query.language || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
  
  // Try to get from cache first
  const cacheKey = `post:${req.params.slug}:${language}`;
  const cachedPost = await cache.get(cacheKey);
  
  if (cachedPost) {
    return res.send(cachedPost);
  }
  
  // Get post with proper language
  const post = await blogService.getPostBySlug(req.params.slug, language);
  
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, i18next.t('blog:postNotFound', { ns: 'blog' }));
  }
  
  // Track post view
  analyticsService.trackEvent('post_viewed', {
    postId: post.id,
    language,
    isUnique: true, // Could be determined by user session
    userId: req.user?.id,
    referrer: req.headers.referer
  });
  
  // Increment view count
  await blogService.incrementViews(post.id, true);
  
  // Cache result for 10 minutes
  await cache.set(cacheKey, post, 600);
  
  res.send(post);
});

/**
 * Get blog post by ID
 * @public
 */
const getPost = catchAsync(async (req, res) => {
  // Extract language from request or use default
  const language = req.query.language || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
  
  const post = await blogService.getPostById(req.params.id, language);
  
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, i18next.t('blog:postNotFound', { ns: 'blog' }));
  }
  
  res.send(post);
});

/**
 * Update blog post
 * @restricted to author or admin
 */
const updatePost = catchAsync(async (req, res) => {
  const post = await blogService.updatePost(
    req.params.id, 
    req.body, 
    req.user.id
  );
  
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, i18next.t('blog:postNotFound', { ns: 'blog' }));
  }
  
  // Clear cache for this post in all languages
  await cache.clearByPattern(`post:${post.slug}:*`);
  await cache.clearByPattern(`post:${post.id}:*`);
  await cache.clearByPattern('posts:*');
  
  res.send(post);
});

/**
 * Delete blog post (soft delete)
 * @restricted to author or admin
 */
const deletePost = catchAsync(async (req, res) => {
  await blogService.deletePost(req.params.id, req.user.id);
  
  // Clear relevant caches
  await cache.clearByPattern(`post:${req.params.id}:*`);
  await cache.clearByPattern('posts:*');
  
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Generate translations for a post
 * @restricted to author, translator or admin
 */
const translatePost = catchAsync(async (req, res) => {
  const { targetLanguages } = req.body;
  const post = await blogService.getPostById(req.params.id);
  
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, i18next.t('blog:postNotFound', { ns: 'blog' }));
  }
  
  // Generate translations using AI
  const translations = await blogService.translatePost(
    req.params.id, 
    targetLanguages || ['en', 'fr', 'de', 'es']
  );
  
  // Clear cache for this post in all languages
  await cache.clearByPattern(`post:${post.slug}:*`);
  await cache.clearByPattern(`post:${post.id}:*`);
  await cache.clearByPattern('posts:*');
  
  res.send({ translations });
});

/**
 * Generate or update SEO metadata for a post
 * @restricted to author or admin
 */
const updateSEO = catchAsync(async (req, res) => {
  const post = await blogService.getPostById(req.params.id);
  
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, i18next.t('blog:postNotFound', { ns: 'blog' }));
  }
  
  // Generate SEO metadata using AI
  const seoData = await aiService.generateSEO(post.title, post.content);
  
  // Update post with SEO data
  const updatedPost = await blogService.updatePost(
    req.params.id, 
    { 
      metaTitle: seoData.title,
      metaDescription: seoData.description,
      keywords: seoData.keywords
    },
    req.user.id
  );
  
  // Clear cache for this post
  await cache.clearByPattern(`post:${post.slug}:*`);
  await cache.clearByPattern(`post:${post.id}:*`);
  
  res.send(updatedPost);
});

/**
 * Track affiliate link click
 * @public
 */
const trackAffiliateClick = catchAsync(async (req, res) => {
  const { linkIndex } = req.body;
  
  if (linkIndex === undefined) {
    throw new ApiError(httpStatus.BAD_REQUEST, i18next.t('blog:linkIndexRequired', { ns: 'blog' }));
  }
  
  const result = await blogService.trackAffiliateClick(
    req.params.id, 
    linkIndex, 
    req.user?.id
  );
  
  // Track analytics
  analyticsService.trackEvent('affiliate_click', {
    postId: req.params.id,
    linkIndex,
    userId: req.user?.id,
    tool: result.tool,
    referrer: req.headers.referer
  });
  
  res.send(result);
});

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
