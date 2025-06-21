const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const affiliateLinkSchema = mongoose.Schema(
  {
    tool: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    commission: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    conversions: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastClicked: {
      type: Date,
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
affiliateLinkSchema.plugin(toJSON);

const affiliateSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    links: [affiliateLinkSchema],
    category: {
      type: String,
      trim: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Track total metrics across all links
    totalClicks: {
      type: Number,
      default: 0,
    },
    totalConversions: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
affiliateSchema.plugin(toJSON);
affiliateSchema.plugin(paginate);

/**
 * Get top performing affiliate programs
 * @param {number} limit - Number of results to return
 * @returns {Promise<Affiliate[]>}
 */
affiliateSchema.statics.getTopPerforming = async function (limit = 10) {
  return this.find({ active: true })
    .sort({ totalRevenue: -1 })
    .limit(limit);
};

/**
 * Track affiliate link click
 * @param {string} affiliateId - Affiliate ID
 * @param {string} linkId - Link ID
 * @returns {Promise<Object>} - Updated affiliate link
 */
affiliateSchema.statics.trackClick = async function (affiliateId, linkId) {
  const affiliate = await this.findById(affiliateId);
  if (!affiliate) {
    throw new Error('Affiliate not found');
  }

  const link = affiliate.links.id(linkId);
  if (!link) {
    throw new Error('Link not found');
  }

  link.clicks += 1;
  link.lastClicked = new Date();
  affiliate.totalClicks += 1;
  
  await affiliate.save();
  
  return link;
};

/**
 * Register affiliate conversion
 * @param {string} affiliateId - Affiliate ID
 * @param {string} linkId - Link ID
 * @param {number} amount - Revenue amount
 * @returns {Promise<Object>} - Updated affiliate link
 */
affiliateSchema.statics.registerConversion = async function (affiliateId, linkId, amount) {
  const affiliate = await this.findById(affiliateId);
  if (!affiliate) {
    throw new Error('Affiliate not found');
  }

  const link = affiliate.links.id(linkId);
  if (!link) {
    throw new Error('Link not found');
  }

  link.conversions += 1;
  link.revenue += amount;
  affiliate.totalConversions += 1;
  affiliate.totalRevenue += amount;
  
  await affiliate.save();
  
  return link;
};

/**
 * @typedef {Object} AffiliateLink
 */

/**
 * @typedef Affiliate
 */
const Affiliate = mongoose.model('Affiliate', affiliateSchema);

module.exports = Affiliate;
