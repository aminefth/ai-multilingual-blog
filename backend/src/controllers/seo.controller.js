const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { BlogPost } = require('../models');
const ApiError = require('../utils/ApiError');
const aiService = require('../services/ai.service');
const analyticsService = require('../services/analytics.service');
const { cache } = require('../config/redis');

/**
 * SEO Controller for managing metadata across the blog
 */

/**
 * Generate SEO metadata for a blog post
 * @route POST /v1/seo/generate/:postId
 * @access Private (requires manageBlogPosts permission)
 */
const generateSEOMetadata = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const { language } = req.query;

  const post = await BlogPost.findById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog post not found');
  }

  // Choose appropriate content based on language
  let content = post.content;
  let title = post.title;

  if (language && language !== post.language && post.translations && post.translations[language]) {
    content = post.translations[language].content;
    title = post.translations[language].title;
  }

  // Track SEO generation attempt
  await analyticsService.trackEvent('seo_generation', {
    userId: req.user.id,
    postId: post._id,
    language: language || post.language,
  });

  // Generate SEO metadata using AI
  const seoMetadata = await aiService.generateSEO(title, content);

  // Prepare update object
  const updateData = {};

  // If we're dealing with the primary language
  if (!language || language === post.language) {
    updateData.metaTitle = seoMetadata.title;
    updateData.metaDescription = seoMetadata.description;
    updateData.keywords = seoMetadata.keywords;
  }
  // If we're dealing with a translation
  else if (post.translations && post.translations[language]) {
    if (!post.translations[language].meta) {
      post.translations[language].meta = {};
    }

    updateData[`translations.${language}.meta.title`] = seoMetadata.title;
    updateData[`translations.${language}.meta.description`] = seoMetadata.description;
    updateData[`translations.${language}.meta.keywords`] = seoMetadata.keywords;
  }

  // Update the post with new SEO metadata
  await BlogPost.findByIdAndUpdate(postId, { $set: updateData }, { new: true });

  res.status(httpStatus.OK).json({
    message: 'SEO metadata generated successfully',
    seoMetadata,
  });
});

/**
 * Update SEO metadata for a blog post
 * @route PUT /v1/seo/:postId
 * @access Private (requires manageBlogPosts permission)
 */
const updateSEOMetadata = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const { metaTitle, metaDescription, keywords, language, canonicalUrl } = req.body;

  const post = await BlogPost.findById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog post not found');
  }

  // Prepare update object
  const updateData = {};

  // If we're dealing with the primary language
  if (!language || language === post.language) {
    if (metaTitle) updateData.metaTitle = metaTitle;
    if (metaDescription) updateData.metaDescription = metaDescription;
    if (keywords) updateData.keywords = keywords;
    if (canonicalUrl) updateData.canonicalUrl = canonicalUrl;
  }
  // If we're dealing with a translation
  else if (post.translations && post.translations[language]) {
    if (metaTitle) updateData[`translations.${language}.meta.title`] = metaTitle;
    if (metaDescription) updateData[`translations.${language}.meta.description`] = metaDescription;
    if (keywords) updateData[`translations.${language}.meta.keywords`] = keywords;
  }

  // Update the post with new SEO metadata
  const updatedPost = await BlogPost.findByIdAndUpdate(postId, { $set: updateData }, { new: true });

  // Clear cache for this post
  await cache.del(`cache:/api/v1/blog/${post._id}`);
  await cache.del(`cache:/api/v1/blog/slug/${post.slug}`);

  res.status(httpStatus.OK).json({
    message: 'SEO metadata updated successfully',
    post: {
      id: updatedPost._id,
      title: updatedPost.title,
      slug: updatedPost.slug,
      metaTitle:
        language && language !== post.language
          ? updatedPost.translations?.[language]?.meta?.title
          : updatedPost.metaTitle,
      metaDescription:
        language && language !== post.language
          ? updatedPost.translations?.[language]?.meta?.description
          : updatedPost.metaDescription,
      keywords:
        language && language !== post.language
          ? updatedPost.translations?.[language]?.meta?.keywords
          : updatedPost.keywords,
      canonicalUrl: updatedPost.canonicalUrl,
    },
  });
});

/**
 * Get SEO metadata for a blog post
 * @route GET /v1/seo/:postId
 * @access Private (requires manageBlogPosts permission)
 */
const getSEOMetadata = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const { language } = req.query;

  const post = await BlogPost.findById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog post not found');
  }

  let seoData = {
    title: post.title,
    slug: post.slug,
    metaTitle: post.metaTitle || post.title,
    metaDescription: post.metaDescription,
    keywords: post.keywords || [],
    canonicalUrl: post.canonicalUrl,
    language: post.language || 'en',
  };

  // If requesting translation SEO data
  if (language && language !== post.language && post.translations && post.translations[language]) {
    const translation = post.translations[language];
    seoData = {
      title: translation.title || post.title,
      slug: translation.slug || post.slug,
      metaTitle: translation.meta?.title || translation.title || post.metaTitle,
      metaDescription: translation.meta?.description || post.metaDescription,
      keywords: translation.meta?.keywords || post.keywords || [],
      canonicalUrl: post.canonicalUrl,
      language,
    };
  }

  res.status(httpStatus.OK).json(seoData);
});

/**
 * Get site-wide SEO settings
 * @route GET /v1/seo/site-settings
 * @access Private (requires admin permission)
 */
const getSiteSEOSettings = catchAsync(async (req, res) => {
  // In a real implementation, this would fetch from a settings collection
  // Here we're returning default values

  const settings = {
    siteName: 'AI Tools Blog',
    siteDescription: 'The latest reviews and insights on AI tools for businesses and entrepreneurs',
    defaultOgImage: '/images/site-default-og.jpg',
    googleAnalyticsId: 'UA-XXXXXXXXX-X',
    googleSiteVerification: '',
    bingSiteVerification: '',
    robots: 'index, follow',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AI Tools Blog',
      url: 'https://aitoolsblog.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://aitoolsblog.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  };

  res.status(httpStatus.OK).json(settings);
});

/**
 * Update site-wide SEO settings
 * @route PUT /v1/seo/site-settings
 * @access Private (requires admin permission)
 */
const updateSiteSEOSettings = catchAsync(async (req, res) => {
  const {
    siteName,
    siteDescription,
    defaultOgImage,
    googleAnalyticsId,
    googleSiteVerification,
    bingSiteVerification,
    robots,
    structuredData,
  } = req.body;

  // In a real implementation, this would update a settings collection
  // Here we just acknowledge the request

  // Track settings update
  await analyticsService.trackEvent('seo_settings_updated', {
    userId: req.user.id,
    updatedFields: Object.keys(req.body),
  });

  res.status(httpStatus.OK).json({
    message: 'SEO settings updated successfully',
    settings: {
      siteName,
      siteDescription,
      defaultOgImage,
      googleAnalyticsId,
      googleSiteVerification,
      bingSiteVerification,
      robots,
      structuredData,
    },
  });
});

module.exports = {
  generateSEOMetadata,
  updateSEOMetadata,
  getSEOMetadata,
  getSiteSEOSettings,
  updateSiteSEOSettings,
};
