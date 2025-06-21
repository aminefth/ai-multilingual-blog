const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const subscriptionSchema = mongoose.Schema(
  {
    planId: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'trialing'],
      default: 'active',
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const affiliateStatsSchema = mongoose.Schema(
  {
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
    lastClickDate: Date,
    lastConversionDate: Date,
  },
  { _id: false }
);

const userSchema = mongoose.Schema(
  {
    // Basic information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    
    // Profile
    avatar: String,
    bio: {
      type: String,
      maxlength: 500,
    },
    website: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error('Invalid URL');
        }
      },
    },
    company: String,
    position: String,
    
    // Preferences
    preferredLanguage: {
      type: String,
      enum: ['en', 'fr', 'de', 'es'],
      default: 'en',
    },
    
    // Subscription
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
    
    // Affiliate program
    affiliateCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    affiliateStats: {
      type: affiliateStatsSchema,
      default: () => ({}),
    },
    paymentDetails: {
      type: {
        paypalEmail: String,
        bankAccountInfo: String,
      },
      private: true,
    },
    
    // Access control
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if affiliate code is taken
 * @param {string} code - The affiliate code
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isAffiliateCodeTaken = async function (code, excludeUserId) {
  const user = await this.findOne({ affiliateCode: code, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  
  // Hash password if modified
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  
  // Generate affiliate code if not set and user is verified
  if (!user.affiliateCode && user.isEmailVerified) {
    const randomString = crypto.randomBytes(8).toString('hex');
    // Check if code is unique before assigning
    const isCodeTaken = await user.constructor.isAffiliateCodeTaken(randomString);
    if (!isCodeTaken) {
      user.affiliateCode = randomString;
    }
  }
  
  // Set lastLogin if it's a new user
  if (user.isNew) {
    user.lastLogin = new Date();
  }
  
  next();
});

/**
 * Record user login
 * @returns {Promise<void>}
 */
userSchema.methods.recordLogin = async function() {
  this.lastLogin = new Date();
  return this.save();
};

/**
 * Track affiliate click
 * @returns {Promise<void>}
 */
userSchema.methods.trackAffiliateClick = async function() {
  this.affiliateStats.clicks += 1;
  this.affiliateStats.lastClickDate = new Date();
  return this.save();
};

/**
 * Track affiliate conversion
 * @param {number} amount - Amount of revenue generated
 * @returns {Promise<void>}
 */
userSchema.methods.trackAffiliateConversion = async function(amount) {
  this.affiliateStats.conversions += 1;
  this.affiliateStats.revenue += amount;
  this.affiliateStats.lastConversionDate = new Date();
  return this.save();
};

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
