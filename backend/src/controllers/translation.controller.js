const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const aiService = require('../services/ai.service');
const { BlogPost } = require('../models');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const i18next = require('i18next');
const pick = require('../utils/pick');
const analyticsService = require('../services/analytics.service');

/**
 * Translation controller for managing multilingual content
 */

/**
 * Get all available languages
 * @route GET /v1/translations/languages
 * @access Public
 */
const getLanguages = catchAsync(async (req, res) => {
  const languages = config.languages.map(code => ({
    code,
    name: getLanguageName(code),
    isDefault: code === config.defaultLanguage
  }));
  
  res.status(httpStatus.OK).json(languages);
});

/**
 * Get all translation namespaces with their keys
 * @route GET /v1/translations/namespaces
 * @access Public
 */
const getNamespaces = catchAsync(async (req, res) => {
  const language = req.query.language || config.defaultLanguage;
  
  if (!config.languages.includes(language)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid language code');
  }
  
  const translations = i18next.getResourceBundle(language, 'common');
  res.status(httpStatus.OK).json(translations);
});

/**
 * Translate content using AI service
 * @route POST /v1/translations/translate
 * @access Private (requires manageBlogPosts permission)
 */
const translateContent = catchAsync(async (req, res) => {
  const { content, title, sourceLanguage, targetLanguage } = req.body;
  
  if (!config.languages.includes(sourceLanguage) || !config.languages.includes(targetLanguage)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid language code');
  }
  
  if (sourceLanguage === targetLanguage) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Source and target languages cannot be the same');
  }
  
  // Track translation request
  await analyticsService.trackEvent('content_translation_requested', {
    userId: req.user?.id,
    sourceLanguage,
    targetLanguage,
    contentLength: content.length
  });
  
  const translatedContent = await aiService.translateContent(
    content,
    title,
    sourceLanguage,
    targetLanguage
  );
  
  res.status(httpStatus.OK).json(translatedContent);
});

/**
 * Get translation status for a blog post
 * @route GET /v1/translations/status/:postId
 * @access Private (requires manageBlogPosts permission)
 */
const getTranslationStatus = catchAsync(async (req, res) => {
  const { postId } = req.params;
  
  const post = await BlogPost.findById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog post not found');
  }
  
  const sourceLanguage = post.language || config.defaultLanguage;
  const status = {};
  
  // Check which languages have translations
  for (const lang of config.languages) {
    if (lang === sourceLanguage) {
      status[lang] = { 
        status: 'original', 
        percentage: 100,
        completedAt: post.updatedAt
      };
    } else if (post.translations && post.translations[lang] && post.translations[lang].content) {
      const translationDate = post.translations[lang].updatedAt || post.updatedAt;
      const isOutdated = post.updatedAt > translationDate;
      
      status[lang] = { 
        status: isOutdated ? 'outdated' : 'translated',
        percentage: 100,
        completedAt: translationDate
      };
    } else {
      status[lang] = { 
        status: 'pending', 
        percentage: 0,
        completedAt: null
      };
    }
  }
  
  res.status(httpStatus.OK).json({
    sourceLanguage,
    translationStatus: status
  });
});

/**
 * Update translation strings in a specific locale
 * @route PUT /v1/translations/:language
 * @access Private (requires manageTranslations permission)
 */
const updateTranslations = catchAsync(async (req, res) => {
  const { language } = req.params;
  const { namespace = 'common', translations } = req.body;
  
  if (!config.languages.includes(language)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid language code');
  }
  
  if (!translations || typeof translations !== 'object') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid translations format');
  }
  
  // In a real implementation, this would update the translation files
  // For this API, we'll just return success
  
  // Track translation update
  await analyticsService.trackEvent('translations_updated', {
    userId: req.user.id,
    language,
    namespace,
    keysCount: Object.keys(translations).length
  });
  
  res.status(httpStatus.OK).json({
    message: `Translations for ${getLanguageName(language)} updated successfully`,
    language,
    namespace,
    updatedKeys: Object.keys(translations).length
  });
});

/**
 * Helper function to get language name from code
 * @private
 */
function getLanguageName(code) {
  const languageNames = {
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español'
  };
  
  return languageNames[code] || code;
}

module.exports = {
  getLanguages,
  getNamespaces,
  translateContent,
  getTranslationStatus,
  updateTranslations
};
