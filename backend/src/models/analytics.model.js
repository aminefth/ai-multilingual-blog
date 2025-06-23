const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const analyticsSchema = mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      index: true,
    },
    postId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'BlogPost',
      index: true,
    },
    data: {
      type: Object,
      default: {},
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    referrer: {
      type: String,
      index: true,
    },
    path: {
      type: String,
      index: true,
    },
    language: {
      type: String,
      enum: ['en', 'fr', 'de', 'es'],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
analyticsSchema.plugin(toJSON);
analyticsSchema.plugin(paginate);

/**
 * Get events by type for a time period
 * @param {string} eventType - Type of event
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>}
 */
analyticsSchema.statics.getEventsByType = async function (eventType, startDate, endDate) {
  return this.find({
    event: eventType,
    timestamp: {
      $gte: startDate,
      $lte: endDate || new Date(),
    },
  }).sort({ timestamp: 1 });
};

/**
 * Get event count for a specific period
 * @param {string} eventType - Type of event
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<number>}
 */
analyticsSchema.statics.getEventCount = async function (eventType, startDate, endDate) {
  return this.countDocuments({
    event: eventType,
    timestamp: {
      $gte: startDate,
      $lte: endDate || new Date(),
    },
  });
};

/**
 * @typedef Analytics
 */
const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
