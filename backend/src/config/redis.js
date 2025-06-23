const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

// Connect to Redis as soon as the module is loaded
(async () => {
  try {
    await client.connect();
    logger.info('Redis client connected');
  } catch (err) {
    logger.error('Redis connection error:', err);
  }
})();

// Handle Redis errors to prevent app crash
client.on('error', (err) => {
  logger.error('Redis error:', err);
});

// Helper functions for common Redis operations
const cache = {
  get: async (key) => {
    try {
      const result = await client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },

  set: async (key, value, ttl = 3600) => {
    try {
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  },

  del: async (key) => {
    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  },

  // Clear cache by pattern
  clearByPattern: async (pattern) => {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis clearByPattern error:', error);
      return false;
    }
  },

  // Increment a counter
  increment: async (key, amount = 1) => {
    try {
      const result = await client.incrBy(key, amount);
      return result;
    } catch (error) {
      logger.error('Redis increment error:', error);
      return null;
    }
  },

  // Get all keys matching pattern
  keys: async (pattern) => {
    try {
      return await client.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      return [];
    }
  },
};

module.exports = { client, cache };
