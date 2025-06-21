const { cache } = require('../config/redis');

/**
 * Cache middleware for HTTP responses
 * Uses Redis to store and retrieve cached responses based on request URL or custom key
 * 
 * @param {number} duration - Cache duration in seconds
 * @param {function} keyGenerator - Optional function to generate custom cache keys
 * @returns {function} - Express middleware
 */
const cacheMiddleware = (duration = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key based on URL or custom key generator
    const key = keyGenerator ? 
      keyGenerator(req) : 
      `cache:${req.originalUrl}:${req.headers['accept-language'] || 'en'}`;
    
    try {
      // Try to get from cache
      const cachedData = await cache.get(key);
      
      if (cachedData) {
        // Add cache header
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }
      
      // Set cache header
      res.set('X-Cache', 'MISS');
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Don't cache error responses
        if (res.statusCode >= 200 && res.statusCode < 400) {
          cache.set(key, data, duration).catch(err => {
            console.error('Redis cache error:', err);
          });
        }
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

module.exports = cacheMiddleware;
