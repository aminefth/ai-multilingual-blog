const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { User, BlogPost } = require('../models');
const { cache } = require('../config/redis');
const analyticsService = require('../services/analytics.service');

/**
 * Admin controller for administrative operations
 */

/**
 * Get admin dashboard data
 * @route GET /v1/admin/dashboard
 * @access Private (requires admin permission)
 */
const getDashboardData = catchAsync(async (req, res) => {
  // Get counts and stats from different collections
  const [
    userCount,
    postCount,
    draftCount,
    publishedCount,
    revenueStats
  ] = await Promise.all([
    User.countDocuments(),
    BlogPost.countDocuments(),
    BlogPost.countDocuments({ status: 'draft' }),
    BlogPost.countDocuments({ status: 'published' }),
    analyticsService.getRevenueStats('30d')
  ]);

  // Get recently joined users
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email roles createdAt');
  
  // Get recently published posts
  const recentPosts = await BlogPost.find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(5)
    .select('title author status publishedAt views uniqueViews');

  // Format response
  const dashboard = {
    stats: {
      users: userCount,
      posts: postCount,
      drafts: draftCount,
      published: publishedCount,
      revenue: {
        total: revenueStats.total,
        affiliate: revenueStats.affiliate,
        subscription: revenueStats.subscription
      }
    },
    recent: {
      users: recentUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        joinedAt: user.createdAt
      })),
      posts: recentPosts.map(post => ({
        id: post._id,
        title: post.title,
        author: post.author,
        status: post.status,
        publishedAt: post.publishedAt,
        views: post.views || 0
      }))
    }
  };

  res.status(httpStatus.OK).json(dashboard);
});

/**
 * Get all users with pagination, filtering, and sorting
 * @route GET /v1/admin/users
 * @access Private (requires admin permission)
 */
const getUsers = catchAsync(async (req, res) => {
  const { 
    page = 1,
    limit = 10,
    sortBy = 'createdAt:desc',
    name,
    email,
    role
  } = req.query;

  // Prepare filter
  const filter = {};
  if (name) filter.name = { $regex: name, $options: 'i' };
  if (email) filter.email = { $regex: email, $options: 'i' };
  if (role) filter.roles = role;

  // Prepare sort
  const [sortField, sortOrder] = sortBy.split(':');
  const sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };

  // Execute query with pagination
  const skip = (Number(page) - 1) * Number(limit);
  
  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-password'),
    User.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalUsers / Number(limit));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  res.status(httpStatus.OK).json({
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalUsers,
      totalPages,
      hasNext,
      hasPrev
    }
  });
});

/**
 * Update user roles
 * @route PATCH /v1/admin/users/:userId/roles
 * @access Private (requires admin permission)
 */
const updateUserRoles = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { roles } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Don't allow removing admin role from yourself
  if (req.user.id === userId && 
      user.roles.includes('admin') && 
      !roles.includes('admin')) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Cannot remove admin role from yourself'
    );
  }

  // Update roles
  user.roles = roles;
  await user.save();

  // Track event
  await analyticsService.trackEvent('user_roles_updated', {
    adminId: req.user.id,
    userId: user.id,
    updatedRoles: roles
  });

  res.status(httpStatus.OK).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles
    }
  });
});

/**
 * Get pending post approvals
 * @route GET /v1/admin/approvals
 * @access Private (requires admin permission)
 */
const getPendingApprovals = catchAsync(async (req, res) => {
  const pendingPosts = await BlogPost.find({ status: 'pending' })
    .populate('author', 'name email')
    .sort({ updatedAt: -1 })
    .select('title description author status updatedAt');

  res.status(httpStatus.OK).json(pendingPosts);
});

/**
 * Approve or reject a blog post
 * @route PATCH /v1/admin/approvals/:postId
 * @access Private (requires admin permission)
 */
const updateApprovalStatus = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const { status, feedbackNote } = req.body;

  if (!['published', 'rejected'].includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Status must be either "published" or "rejected"'
    );
  }

  const post = await BlogPost.findById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  if (post.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only pending posts can be approved or rejected'
    );
  }

  // Update post status
  post.status = status;
  
  // Add feedback note if provided
  if (feedbackNote) {
    if (!post.notes) post.notes = [];
    post.notes.push({
      author: req.user.id,
      content: feedbackNote,
      createdAt: new Date()
    });
  }

  // Set publishedAt if publishing
  if (status === 'published') {
    post.publishedAt = new Date();
  }

  await post.save();

  // Clear cache for blog listings
  await cache.del('cache:/api/v1/blog?');

  // Track event
  await analyticsService.trackEvent('post_approval_updated', {
    adminId: req.user.id,
    postId: post._id,
    status,
    hasFeedback: !!feedbackNote
  });

  res.status(httpStatus.OK).json({
    message: `Post has been ${status === 'published' ? 'approved and published' : 'rejected'}`,
    post: {
      id: post._id,
      title: post.title,
      status: post.status,
      publishedAt: post.publishedAt
    }
  });
});

/**
 * Get system settings
 * @route GET /v1/admin/settings
 * @access Private (requires admin permission)
 */
const getSystemSettings = catchAsync(async (req, res) => {
  // This would typically come from a settings collection in the database
  // For this implementation, we'll use cached or default settings
  
  const cacheKey = 'system:settings';
  let settings = await cache.get(cacheKey);
  
  if (!settings) {
    // Default settings
    settings = {
      general: {
        siteName: 'AI Tools Blog',
        siteDescription: 'The best AI tools reviews and guides',
        contactEmail: 'admin@example.com',
        defaultLanguage: 'en'
      },
      seo: {
        defaultTitle: '{pageName} | AI Tools Blog',
        defaultDescription: 'Discover the latest AI tools and how to use them effectively',
        defaultKeywords: 'ai tools, machine learning, artificial intelligence',
        googleAnalyticsId: '',
        facebookPixelId: ''
      },
      content: {
        postsPerPage: 10,
        maxRelatedPosts: 3,
        defaultFeaturedImage: '/images/default-featured.jpg',
        allowComments: true
      },
      monetization: {
        enableAffiliateLinks: true,
        enableSubscriptions: true,
        defaultCommission: 5
      },
      security: {
        enableCaptcha: true,
        jwtExpiryHours: 24,
        maxLoginAttempts: 5
      }
    };
    
    // Cache for 1 hour
    await cache.set(cacheKey, settings, 3600);
  }
  
  res.status(httpStatus.OK).json(settings);
});

/**
 * Update system settings
 * @route PATCH /v1/admin/settings
 * @access Private (requires admin permission)
 */
const updateSystemSettings = catchAsync(async (req, res) => {
  const { settings } = req.body;
  
  if (!settings) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Settings object is required');
  }
  
  // This would typically update a settings collection in the database
  // For this implementation, we'll update the cache
  
  const cacheKey = 'system:settings';
  await cache.set(cacheKey, settings, 3600);
  
  // Track event
  await analyticsService.trackEvent('system_settings_updated', {
    adminId: req.user.id,
    updatedSections: Object.keys(settings)
  });
  
  res.status(httpStatus.OK).json({
    message: 'System settings updated successfully',
    settings
  });
});

/**
 * Clear system cache
 * @route POST /v1/admin/cache/clear
 * @access Private (requires admin permission)
 */
const clearCache = catchAsync(async (req, res) => {
  const { target } = req.body;
  
  if (target === 'all') {
    // Clear all cache
    await cache.flushDb();
  } else if (target === 'blog') {
    // Clear blog-related cache
    const blogKeys = await cache.keys('cache:/api/v1/blog*');
    if (blogKeys.length > 0) {
      await cache.del(blogKeys);
    }
  } else if (target === 'analytics') {
    // Clear analytics cache
    const analyticsKeys = await cache.keys('cache:/api/v1/analytics*');
    if (analyticsKeys.length > 0) {
      await cache.del(analyticsKeys);
    }
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid cache target');
  }
  
  // Track event
  await analyticsService.trackEvent('cache_cleared', {
    adminId: req.user.id,
    target
  });
  
  res.status(httpStatus.OK).json({
    message: `Cache cleared successfully for target: ${target}`
  });
});

module.exports = {
  getDashboardData,
  getUsers,
  updateUserRoles,
  getPendingApprovals,
  updateApprovalStatus,
  getSystemSettings,
  updateSystemSettings,
  clearCache
};
