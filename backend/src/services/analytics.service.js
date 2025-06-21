const { Analytics, BlogPost, User } = require('../models');
const { cache } = require('../config/redis');

/**
 * Analytics service for tracking user behavior, content performance, and revenue
 */
class AnalyticsService {
  /**
   * Track an analytics event
   * @param {String} event - Event name
   * @param {Object} data - Event data
   * @returns {Promise<Object>} - Created analytics document
   */
  async trackEvent(event, data = {}) {
    const analytics = new Analytics({
      event,
      data,
      timestamp: new Date(),
      userId: data.userId || null,
      postId: data.postId || null
    });
    
    try {
      await analytics.save();
      
      // Update real-time metrics cache
      await this.incrementEventCounter(event);
      
      return analytics;
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      // Still return the event data even if saving fails
      return { event, data, error: error.message };
    }
  }
  
  /**
   * Get revenue statistics for a specified period
   * @param {String} period - Time period (30d, 7d, 90d, etc)
   * @returns {Promise<Object>} - Revenue statistics
   */
  async getRevenueStats(period = '30d') {
    const startDate = this.getPeriodStartDate(period);
    
    const cacheKey = `analytics:revenue:${period}`;
    const cachedStats = await cache.get(cacheKey);
    
    if (cachedStats) {
      return cachedStats;
    }
    
    const [
      affiliateRevenue, 
      subscriptionRevenue, 
      totalUsers,
      newUsers
    ] = await Promise.all([
      this.getAffiliateRevenue(startDate),
      this.getSubscriptionRevenue(startDate),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } })
    ]);
    
    const stats = {
      affiliate: affiliateRevenue,
      subscription: subscriptionRevenue,
      total: affiliateRevenue + subscriptionRevenue,
      users: {
        total: totalUsers,
        new: newUsers,
        growthRate: totalUsers > 0 ? (newUsers / totalUsers * 100).toFixed(2) : 0
      },
      period,
      generatedAt: new Date()
    };
    
    // Cache for 1 hour
    await cache.set(cacheKey, stats, 3600);
    
    return stats;
  }
  
  /**
   * Get top performing blog posts
   * @param {Number} limit - Maximum number of posts to return
   * @returns {Promise<Array>} - Top performing posts
   */
  async getTopPosts(limit = 10) {
    const cacheKey = `analytics:topPosts:${limit}`;
    const cachedPosts = await cache.get(cacheKey);
    
    if (cachedPosts) {
      return cachedPosts;
    }
    
    // Get posts with highest views and revenue
    const posts = await BlogPost.find({ status: 'published' })
      .sort({ views: -1, uniqueViews: -1 })
      .limit(limit)
      .select('title slug views uniqueViews readingTime publishedAt affiliateLinks');
      
    // Calculate additional metrics
    const topPosts = posts.map(post => {
      const totalClicks = post.affiliateLinks?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0;
      const totalRevenue = post.affiliateLinks?.reduce((sum, link) => sum + (link.revenue || 0), 0) || 0;
      const conversionRate = totalClicks > 0 
        ? ((post.affiliateLinks?.reduce((sum, link) => sum + (link.conversions || 0), 0) || 0) / totalClicks * 100).toFixed(2)
        : 0;
        
      return {
        id: post._id,
        title: post.title,
        slug: post.slug,
        views: post.views || 0,
        uniqueViews: post.uniqueViews || 0,
        readingTime: post.readingTime || 0,
        publishedAt: post.publishedAt,
        engagement: post.uniqueViews > 0 ? ((post.views / post.uniqueViews) || 1).toFixed(2) : 1,
        affiliateClicks: totalClicks,
        revenue: totalRevenue,
        conversionRate
      };
    });
    
    // Cache for 6 hours
    await cache.set(cacheKey, topPosts, 21600);
    
    return topPosts;
  }
  
  /**
   * Get affiliate marketing performance data
   * @returns {Promise<Array>} - Affiliate performance by tool
   */
  async getAffiliatePerformance() {
    const cacheKey = 'analytics:affiliatePerformance';
    const cachedPerformance = await cache.get(cacheKey);
    
    if (cachedPerformance) {
      return cachedPerformance;
    }
    
    // Find posts with affiliate links
    const posts = await BlogPost.find({
      'affiliateLinks.0': { $exists: true }
    }).select('affiliateLinks');
    
    // Aggregate performance by tool
    const performance = {};
    
    posts.forEach(post => {
      (post.affiliateLinks || []).forEach(link => {
        if (!link.tool) return;
        
        if (!performance[link.tool]) {
          performance[link.tool] = {
            tool: link.tool,
            clicks: 0,
            conversions: 0,
            revenue: 0
          };
        }
        
        performance[link.tool].clicks += link.clicks || 0;
        performance[link.tool].conversions += link.conversions || 0;
        performance[link.tool].revenue += link.revenue || 0;
      });
    });
    
    // Calculate conversion rates
    const result = Object.values(performance).map(item => ({
      ...item,
      conversionRate: item.clicks > 0 
        ? (item.conversions / item.clicks * 100).toFixed(2)
        : 0
    })).sort((a, b) => b.revenue - a.revenue);
    
    // Cache for 12 hours
    await cache.set(cacheKey, result, 43200);
    
    return result;
  }
  
  /**
   * Get affiliate revenue for a specified period
   * @param {Date} startDate - Start date for revenue calculation
   * @returns {Promise<Number>} - Total affiliate revenue
   * @private
   */
  async getAffiliateRevenue(startDate) {
    // In a real implementation, this would query the Analytics collection
    // with revenue events or affiliate conversion events
    // For now, we'll simulate by getting all posts with affiliate links
    const posts = await BlogPost.find({
      'affiliateLinks.0': { $exists: true },
      updatedAt: { $gte: startDate }
    }).select('affiliateLinks');
    
    return posts.reduce((total, post) => {
      const postRevenue = post.affiliateLinks.reduce(
        (sum, link) => sum + (link.revenue || 0), 
        0
      );
      return total + postRevenue;
    }, 0);
  }
  
  /**
   * Get subscription revenue for a specified period
   * @param {Date} startDate - Start date for revenue calculation
   * @returns {Promise<Number>} - Total subscription revenue
   * @private
   */
  async getSubscriptionRevenue(startDate) {
    // This would query the subscription payment history
    // For now, we'll return a simulated value
    // In production, this would connect to Stripe to get actual revenue
    
    // Basic placeholder implementation
    const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
    return parseFloat((days * 25.5).toFixed(2)); // Simulated average daily subscription revenue
  }
  
  /**
   * Convert a period string (e.g., '30d') to a Date object
   * @param {String} period - Period string (e.g., '7d', '30d', '90d')
   * @returns {Date} - Start date for the period
   * @private
   */
  getPeriodStartDate(period) {
    const now = new Date();
    const match = period.match(/^(\d+)([dwmy])$/);
    
    if (!match) {
      // Default to 30 days if invalid format
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
    
    const [, amount, unit] = match;
    const value = parseInt(amount, 10);
    
    switch (unit) {
      case 'd': return new Date(now - value * 24 * 60 * 60 * 1000);
      case 'w': return new Date(now - value * 7 * 24 * 60 * 60 * 1000);
      case 'm': return new Date(now - value * 30 * 24 * 60 * 60 * 1000);
      case 'y': return new Date(now - value * 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
  }
  
  /**
   * Increment counter for an event type in Redis
   * @param {String} event - Event name to increment
   * @private
   */
  async incrementEventCounter(event) {
    const today = new Date().toISOString().split('T')[0];
    const key = `analytics:events:${event}:${today}`;
    
    await cache.increment(key);
    // Set expiry if key is new (86400 seconds = 1 day)
    await cache.client.expire(key, 86400 * 7); // Keep for 7 days
  }
}

module.exports = new AnalyticsService();
