const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { searchService } = require('../services');

const search = catchAsync(async (req, res) => {
  const { q, limit, offset, language, category, tags, sort, isPremium } = req.query;
  
  // Build filters
  let filters = 'status = "published"';
  
  if (category) {
    filters += ` AND categorySlug = "${category}"`;
  }
  
  if (tags) {
    const tagList = tags.split(',').map((tag) => tag.trim());
    const tagFilters = tagList.map((tag) => `tags = "${tag}"`).join(' OR ');
    filters += ` AND (${tagFilters})`;
  }
  
  if (isPremium !== undefined) {
    filters += ` AND isPremium = ${isPremium}`;
  }

  const results = await searchService.searchBlogPosts(q, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    language,
    filters,
    sort: [sort],
  });

  res.status(httpStatus.OK).json({
    success: true,
    data: results,
  });
});

const getSuggestions = catchAsync(async (req, res) => {
  const { q, limit, language } = req.query;
  
  const suggestions = await searchService.getSuggestions(q, parseInt(limit));
  
  res.status(httpStatus.OK).json({
    success: true,
    data: suggestions,
  });
});

const searchCategories = catchAsync(async (req, res) => {
  const { q, limit = 10, language } = req.query;
  
  const results = await searchService.searchCategories(q, {
    limit: parseInt(limit),
    language,
  });
  
  res.status(httpStatus.OK).json({
    success: true,
    data: results,
  });
});

const getStats = catchAsync(async (req, res) => {
  const stats = await searchService.getIndexStats();
  
  res.status(httpStatus.OK).json({
    success: true,
    data: stats,
  });
});

const reindex = catchAsync(async (req, res) => {
  const { type } = req.body;
  let results = {};

  switch (type) {
    case 'posts':
      results.posts = await searchService.reindexAllBlogPosts();
      break;
    case 'categories':
      results.categories = await searchService.reindexAllCategories();
      break;
    case 'all':
      results.posts = await searchService.reindexAllBlogPosts();
      results.categories = await searchService.reindexAllCategories();
      break;
    default:
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid reindex type',
      });
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: {
      message: `Successfully reindexed ${type}`,
      results,
    },
  });
});

module.exports = {
  search,
  getSuggestions,
  searchCategories,
  getStats,
  reindex,
};
