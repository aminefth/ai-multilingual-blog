const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const analyticsService = require('../services/analytics.service');
const { BlogPost } = require('../models');

/**
 * Analytics controller for tracking user behavior and performance metrics
 */

/**
 * Track an analytics event
 * @route POST /v1/analytics/track
 * @access Public (with tracking ID)
 */
const trackEvent = catchAsync(async (req, res) => {
  const { event, data = {} } = req.body;

  // If user is authenticated, add user ID to the data
  if (req.user) {
    data.userId = req.user.id;
  }

  // Add client IP address and user agent for tracking
  data.ipAddress = req.ip;
  data.userAgent = req.headers['user-agent'];

  await analyticsService.trackEvent(event, data);

  // Return minimal response to keep tracking requests light
  res.status(httpStatus.OK).json({ success: true });
});

/**
 * Get overall analytics dashboard data
 * @route GET /v1/analytics/dashboard
 * @access Private (requires admin permission)
 */
const getDashboardData = catchAsync(async (req, res) => {
  const { period = '30d' } = req.query;

  // Get revenue statistics for period
  const revenueStats = await analyticsService.getRevenueStats(period);

  // Get top performing posts
  const topPosts = await analyticsService.getTopPosts(10);

  // Get affiliate marketing performance
  const affiliatePerformance = await analyticsService.getAffiliatePerformance();

  // Get user metrics
  const userMetrics = {
    totalUsers: revenueStats.users.total,
    newUsers: revenueStats.users.new,
    growthRate: revenueStats.users.growthRate,
    subscriberCount: await countSubscribers(),
    conversionRate: calculateSubscriberRate(revenueStats.users.total),
  };

  // Combine all metrics into a single dashboard response
  const dashboardData = {
    period,
    revenue: {
      total: revenueStats.total,
      breakdown: {
        affiliate: revenueStats.affiliate,
        subscription: revenueStats.subscription,
      },
    },
    content: {
      topPosts,
      totalPosts: await countTotalPosts(),
      publishedThisPeriod: await countPostsInPeriod(period),
    },
    users: userMetrics,
    affiliatePerformance,
  };

  res.status(httpStatus.OK).json(dashboardData);
});

/**
 * Get content performance metrics
 * @route GET /v1/analytics/content
 * @access Private (requires manageBlogPosts permission)
 */
const getContentPerformance = catchAsync(async (req, res) => {
  const { period = '30d', limit = 20 } = req.query;

  // Get top performing posts with more details
  const posts = await analyticsService.getTopPosts(limit);

  // Get posts published in period
  const recentPosts = await getRecentPosts(period, limit);

  // Calculate aggregated metrics
  const aggregatedMetrics = calculateAggregatedMetrics(posts);

  res.status(httpStatus.OK).json({
    period,
    metrics: aggregatedMetrics,
    topPosts: posts,
    recentPosts,
  });
});

/**
 * Get revenue metrics
 * @route GET /v1/analytics/revenue
 * @access Private (requires admin permission)
 */
const getRevenueMetrics = catchAsync(async (req, res) => {
  const { period = '30d' } = req.query;

  // Get revenue statistics
  const revenueStats = await analyticsService.getRevenueStats(period);

  // Get historical revenue data (mock function - would be implemented with real data)
  const revenueHistory = await getRevenueHistory(period);

  // Get affiliate performance
  const affiliatePerformance = await analyticsService.getAffiliatePerformance();

  res.status(httpStatus.OK).json({
    period,
    currentRevenue: revenueStats.total,
    breakdown: {
      affiliate: revenueStats.affiliate,
      subscription: revenueStats.subscription,
    },
    history: revenueHistory,
    affiliatePerformance,
    projectedRevenue: calculateProjectedRevenue(revenueHistory),
  });
});

/**
 * Get user engagement metrics
 * @route GET /v1/analytics/engagement
 * @access Private (requires admin permission)
 */
const getUserEngagement = catchAsync(async (req, res) => {
  const { period = '30d' } = req.query;

  // Get user metrics
  const revenueStats = await analyticsService.getRevenueStats(period);

  // Get engagement events (mock function - would use real events from Analytics collection)
  const engagementEvents = await getEngagementEvents(period);

  // Format response
  const engagement = {
    users: {
      total: revenueStats.users.total,
      new: revenueStats.users.new,
      returning: revenueStats.users.total - revenueStats.users.new,
      growthRate: revenueStats.users.growthRate,
    },
    engagement: {
      averageSessionDuration: engagementEvents.averageSessionDuration,
      pageViewsPerSession: engagementEvents.pageViewsPerSession,
      bounceRate: engagementEvents.bounceRate,
      commentCount: engagementEvents.commentCount,
    },
    retention: {
      day1: engagementEvents.retention.day1,
      day7: engagementEvents.retention.day7,
      day30: engagementEvents.retention.day30,
    },
    subscriptions: {
      total: await countSubscribers(),
      conversionRate: calculateSubscriberRate(revenueStats.users.total),
      churnRate: await calculateChurnRate(period),
    },
  };

  res.status(httpStatus.OK).json({
    period,
    engagement,
  });
});

/**
 * Helper function to count total subscribers
 * @private
 */
async function countSubscribers() {
  // In a real implementation, this would count users with active subscriptions
  // Mock implementation for now
  return 120;
}

/**
 * Helper function to calculate subscriber conversion rate
 * @private
 */
function calculateSubscriberRate(totalUsers) {
  const subscribers = 120; // Hardcoded for example
  return totalUsers > 0 ? ((subscribers / totalUsers) * 100).toFixed(2) : 0;
}

/**
 * Helper function to count total published blog posts
 * @private
 */
async function countTotalPosts() {
  return BlogPost.countDocuments({ status: 'published' });
}

/**
 * Helper function to count posts published in a given period
 * @private
 */
async function countPostsInPeriod(period) {
  const startDate = getStartDateFromPeriod(period);
  return BlogPost.countDocuments({
    status: 'published',
    publishedAt: { $gte: startDate },
  });
}

/**
 * Helper function to get recent posts
 * @private
 */
async function getRecentPosts(period, limit) {
  const startDate = getStartDateFromPeriod(period);

  const posts = await BlogPost.find({
    status: 'published',
    publishedAt: { $gte: startDate },
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('title slug views uniqueViews publishedAt');

  return posts.map((post) => ({
    id: post._id,
    title: post.title,
    slug: post.slug,
    views: post.views || 0,
    uniqueViews: post.uniqueViews || 0,
    publishedAt: post.publishedAt,
  }));
}

/**
 * Helper function to calculate aggregated metrics
 * @private
 */
function calculateAggregatedMetrics(posts) {
  if (!posts || posts.length === 0) {
    return {
      totalViews: 0,
      totalUniqueViews: 0,
      averageEngagement: 0,
      averageRevenue: 0,
    };
  }

  const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
  const totalUniqueViews = posts.reduce((sum, post) => sum + post.uniqueViews, 0);
  const totalRevenue = posts.reduce((sum, post) => sum + (post.revenue || 0), 0);

  return {
    totalViews,
    totalUniqueViews,
    averageEngagement: totalViews > 0 ? (totalViews / posts.length).toFixed(2) : 0,
    averageRevenue: (totalRevenue / posts.length).toFixed(2),
  };
}

/**
 * Helper function to get historical revenue data
 * @private
 */
async function getRevenueHistory(period) {
  // This would query the actual revenue data from database
  // Mock implementation for now

  // Generate dates based on period
  const numDays = getPeriodDays(period);
  const history = [];

  // Generate mock revenue data for each day
  for (let i = 0; i < numDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    history.unshift({
      date: dateStr,
      total: parseFloat((Math.random() * 100 + 50).toFixed(2)),
      affiliate: parseFloat((Math.random() * 60 + 20).toFixed(2)),
      subscription: parseFloat((Math.random() * 40 + 30).toFixed(2)),
    });
  }

  return history;
}

/**
 * Helper function to calculate projected revenue
 * @private
 */
function calculateProjectedRevenue(history) {
  // Simple projection based on average daily growth
  if (!history || history.length < 7) {
    return 0;
  }

  // Calculate average daily revenue from last 7 days
  const last7Days = history.slice(-7);
  const sum = last7Days.reduce((total, day) => total + day.total, 0);
  const averageDaily = sum / 7;

  // Project for next 30 days
  return parseFloat((averageDaily * 30).toFixed(2));
}

/**
 * Helper function to get engagement events
 * @private
 */
async function getEngagementEvents(_period) {
  // This would query the actual analytics events from database
  // Mock implementation for now

  return {
    averageSessionDuration: '3m 24s',
    pageViewsPerSession: 2.7,
    bounceRate: '38%',
    commentCount: 156,
    retention: {
      day1: '68%',
      day7: '42%',
      day30: '29%',
    },
  };
}

/**
 * Helper function to calculate churn rate
 * @private
 */
async function calculateChurnRate(_period) {
  // This would calculate actual churn rate from subscription data
  // Mock implementation for now
  return '5.2%';
}

/**
 * Helper function to get start date from period string
 * @private
 */
function getStartDateFromPeriod(period) {
  const now = new Date();
  const match = period.match(/^(\d+)([dwmy])$/);

  if (!match) {
    // Default to 30 days if invalid format
    return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }

  const [, amount, unit] = match;
  const value = parseInt(amount, 10);

  switch (unit) {
    case 'd':
      return new Date(now - value * 24 * 60 * 60 * 1000);
    case 'w':
      return new Date(now - value * 7 * 24 * 60 * 60 * 1000);
    case 'm':
      return new Date(now - value * 30 * 24 * 60 * 60 * 1000);
    case 'y':
      return new Date(now - value * 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Helper function to get number of days in a period
 * @private
 */
function getPeriodDays(period) {
  const match = period.match(/^(\d+)([dwmy])$/);

  if (!match) {
    return 30; // Default
  }

  const [, amount, unit] = match;
  const value = parseInt(amount, 10);

  switch (unit) {
    case 'd':
      return value;
    case 'w':
      return value * 7;
    case 'm':
      return value * 30;
    case 'y':
      return value * 365;
    default:
      return 30;
  }
}

module.exports = {
  trackEvent,
  getDashboardData,
  getContentPerformance,
  getRevenueMetrics,
  getUserEngagement,
};
