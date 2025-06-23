/**
 * Logger utility for consistent logging throughout the application
 * Wraps console methods with additional functionality
 */
const logger = {
  info: (...args) => {
    console.info(...args);
  },
  error: (...args) => {
    logger.error(...args);
  },
  warn: (...args) => {
    logger.warn(...args);
  },
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...args);
    }
  },
};

module.exports = logger;
