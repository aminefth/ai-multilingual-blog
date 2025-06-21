const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
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
  role: {
    type: String,
    enum: ['user', 'admin', 'editor', 'affiliate'],
    default: 'user',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid', 'trial'],
    },
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'fr', 'de', 'es'],
    default: 'en',
  },
  affiliateCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  affiliateStats: {
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
  },
}, {
  timestamps: true,
});

// Add plugin that converts mongoose to json
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

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
 * Check if password matches the user's password
 * @param {string} password - Password to check
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

/**
 * Hash user password before saving
 */
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * Generate affiliate code for new affiliates
 */
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isNew && user.role === 'affiliate' && !user.affiliateCode) {
    // Generate random code based on username and random string
    const randomStr = Math.random().toString(36).substring(2, 8);
    user.affiliateCode = `${user.name.substring(0, 3)}-${randomStr}`.toLowerCase();
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
