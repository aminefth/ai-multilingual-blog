const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { BlogPost, User } = require('../models');
const analyticsService = require('../services/analytics.service');
const { cache } = require('../config/redis');

/**
 * Affiliate controller for managing affiliate links, tracking, and reporting
 */

/**
 * Get all affiliate tools
 * @route GET /v1/affiliate/tools
 * @access Private (requires manageBlogPosts permission)
 */
const getAffiliateTools = catchAsync(async (req, res) => {
  // This would typically fetch from a separate collection of affiliate tools
  // For this implementation, we'll aggregate from existing posts
  
  const cacheKey = 'affiliate:tools';
  const cachedTools = await cache.get(cacheKey);
  
  if (cachedTools) {
    return res.status(httpStatus.OK).json(cachedTools);
  }
  
  // Find posts with affiliate links
  const posts = await BlogPost.find({
    'affiliateLinks.0': { $exists: true }
  }).select('affiliateLinks');
  
  // Aggregate tools
  const toolsMap = {};
  
  posts.forEach(post => {
    (post.affiliateLinks || []).forEach(link => {
      if (!link.tool) return;
      
      if (!toolsMap[link.tool]) {
        toolsMap[link.tool] = {
          name: link.tool,
          url: link.url || '',
          commission: link.commission || 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          postCount: 0
        };
      }
      
      toolsMap[link.tool].totalClicks += link.clicks || 0;
      toolsMap[link.tool].totalConversions += link.conversions || 0;
      toolsMap[link.tool].totalRevenue += link.revenue || 0;
      toolsMap[link.tool].postCount += 1;
    });
  });
  
  const tools = Object.values(toolsMap).map(tool => ({
    ...tool,
    conversionRate: tool.totalClicks > 0 
      ? ((tool.totalConversions / tool.totalClicks) * 100).toFixed(2) 
      : 0
  }));
  
  // Sort by revenue
  tools.sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  // Cache for 1 hour
  await cache.set(cacheKey, tools, 3600);
  
  res.status(httpStatus.OK).json(tools);
});

/**
 * Track affiliate link click
 * @route POST /v1/affiliate/track
 * @access Public
 */
const trackAffiliateClick = catchAsync(async (req, res) => {
  const { postId, linkIndex, redirectUrl } = req.body;
  
  if (!postId || linkIndex === undefined || linkIndex === null) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing postId or linkIndex');
  }
  
  // Find the post
  const post = await BlogPost.findById(postId);
  
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }
  
  if (!post.affiliateLinks || !post.affiliateLinks[linkIndex]) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Affiliate link not found');
  }
  
  // Get the link
  const link = post.affiliateLinks[linkIndex];
  
  // Increment click count
  post.affiliateLinks[linkIndex].clicks = (link.clicks || 0) + 1;
  await post.save();
  
  // Track click event for analytics
  await analyticsService.trackEvent('affiliate_link_click', {
    userId: req.user?.id,
    postId: post._id,
    tool: link.tool,
    linkUrl: link.url,
    linkText: link.text
  });
  
  // Return the URL to redirect to
  res.status(httpStatus.OK).json({
    url: link.url || redirectUrl,
    trackingId: `${post._id}-${linkIndex}-${Date.now()}`
  });
});

/**
 * Register a conversion for an affiliate link
 * @route POST /v1/affiliate/conversion
 * @access Private (requires admin permission)
 */
const registerConversion = catchAsync(async (req, res) => {
  const { postId, linkIndex, revenue, customerId } = req.body;
  
  if (!postId || linkIndex === undefined || linkIndex === null) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing postId or linkIndex');
  }
  
  // Find the post
  const post = await BlogPost.findById(postId);
  
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }
  
  if (!post.affiliateLinks || !post.affiliateLinks[linkIndex]) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Affiliate link not found');
  }
  
  // Update conversion data
  post.affiliateLinks[linkIndex].conversions = 
    (post.affiliateLinks[linkIndex].conversions || 0) + 1;
    
  if (revenue) {
    post.affiliateLinks[linkIndex].revenue = 
      (post.affiliateLinks[linkIndex].revenue || 0) + parseFloat(revenue);
  }
  
  await post.save();
  
  // Track conversion event for analytics
  await analyticsService.trackEvent('affiliate_conversion', {
    userId: req.user.id,
    postId: post._id,
    tool: post.affiliateLinks[linkIndex].tool,
    linkUrl: post.affiliateLinks[linkIndex].url,
    revenue,
    customerId
  });
  
  // Clear cache for this post
  await cache.del(`cache:/api/v1/blog/${post._id}`);
  await cache.del(`cache:/api/v1/blog/slug/${post.slug}`);
  
  res.status(httpStatus.OK).json({
    message: 'Conversion registered successfully',
    tool: post.affiliateLinks[linkIndex].tool,
    conversions: post.affiliateLinks[linkIndex].conversions,
    revenue: post.affiliateLinks[linkIndex].revenue
  });
});

/**
 * Get affiliate performance report
 * @route GET /v1/affiliate/report
 * @access Private (requires admin permission)
 */
const getAffiliateReport = catchAsync(async (req, res) => {
  const { period = '30d', tool } = req.query;
  
  // Get performance data
  const affiliatePerformance = await analyticsService.getAffiliatePerformance();
  
  // Filter by tool if specified
  let filteredPerformance = affiliatePerformance;
  if (tool) {
    filteredPerformance = affiliatePerformance.filter(
      item => item.tool.toLowerCase() === tool.toLowerCase()
    );
  }
  
  // Calculate totals
  const totalClicks = filteredPerformance.reduce(
    (sum, item) => sum + item.clicks, 0
  );
  
  const totalConversions = filteredPerformance.reduce(
    (sum, item) => sum + item.conversions, 0
  );
  
  const totalRevenue = filteredPerformance.reduce(
    (sum, item) => sum + item.revenue, 0
  );
  
  const averageConversionRate = totalClicks > 0 
    ? ((totalConversions / totalClicks) * 100).toFixed(2)
    : 0;
  
  // Get top posts with these affiliate links
  const topPosts = await getTopPostsWithAffiliateLinks(tool);
  
  res.status(httpStatus.OK).json({
    period,
    tool: tool || 'all',
    summary: {
      totalClicks,
      totalConversions,
      totalRevenue,
      averageConversionRate
    },
    tools: filteredPerformance,
    topPosts
  });
});

/**
 * Add affiliate link to blog post
 * @route POST /v1/affiliate/links
 * @access Private (requires manageBlogPosts permission)
 */
const addAffiliateLink = catchAsync(async (req, res) => {
  const { postId, link } = req.body;
  
  if (!postId || !link) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing postId or link data');
  }
  
  // Validate link data
  if (!link.text || !link.url || !link.tool) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Link must contain text, url, and tool'
    );
  }
  
  // Find the post
  const post = await BlogPost.findById(postId);
  
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }
  
  // Add affiliate link
  if (!post.affiliateLinks) {
    post.affiliateLinks = [];
  }
  
  post.affiliateLinks.push({
    text: link.text,
    url: link.url,
    tool: link.tool,
    commission: link.commission || 0,
    clicks: 0,
    conversions: 0,
    revenue: 0
  });
  
  await post.save();
  
  // Clear cache for this post
  await cache.del(`cache:/api/v1/blog/${post._id}`);
  await cache.del(`cache:/api/v1/blog/slug/${post.slug}`);
  
  res.status(httpStatus.CREATED).json({
    message: 'Affiliate link added successfully',
    linkIndex: post.affiliateLinks.length - 1,
    link: post.affiliateLinks[post.affiliateLinks.length - 1]
  });
});

/**
 * Helper function to get top posts with affiliate links
 * @private
 */
async function getTopPostsWithAffiliateLinks(tool) {
  const query = { 'affiliateLinks.0': { $exists: true } };
  
  if (tool) {
    query['affiliateLinks.tool'] = tool;
  }
  
  const posts = await BlogPost.find(query)
    .select('title slug affiliateLinks views uniqueViews')
    .sort({ views: -1 })
    .limit(10);
  
  return posts.map(post => {
    // Calculate total affiliate metrics for this post
    const totalClicks = post.affiliateLinks.reduce(
      (sum, link) => sum + (link.clicks || 0), 0
    );
    
    const totalConversions = post.affiliateLinks.reduce(
      (sum, link) => sum + (link.conversions || 0), 0
    );
    
    const totalRevenue = post.affiliateLinks.reduce(
      (sum, link) => sum + (link.revenue || 0), 0
    );
    
    const filteredLinks = tool
      ? post.affiliateLinks.filter(link => link.tool === tool)
      : post.affiliateLinks;
    
    return {
      id: post._id,
      title: post.title,
      slug: post.slug,
      views: post.views || 0,
      uniqueViews: post.uniqueViews || 0,
      clickThroughRate: post.views > 0 
        ? ((totalClicks / post.views) * 100).toFixed(2)
        : 0,
      conversionRate: totalClicks > 0 
        ? ((totalConversions / totalClicks) * 100).toFixed(2)
        : 0,
      revenue: totalRevenue,
      affiliateLinks: filteredLinks.map(link => ({
        tool: link.tool,
        clicks: link.clicks || 0,
        conversions: link.conversions || 0,
        revenue: link.revenue || 0
      }))
    };
  });
}

module.exports = {
  getAffiliateTools,
  trackAffiliateClick,
  registerConversion,
  getAffiliateReport,
  addAffiliateLink
};
