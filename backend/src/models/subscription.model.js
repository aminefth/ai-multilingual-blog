const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const priceSchema = mongoose.Schema(
  {
    stripeId: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
      enum: ['usd', 'eur', 'gbp'],
    },
    amount: {
      type: Number,
      required: true,
    },
    interval: {
      type: String,
      enum: ['month', 'year'],
      default: 'month',
    },
  },
  { _id: false }
);

const featureSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    enabled: {
      type: Boolean,
      default: true,
    },
    limit: Number,
  },
  { _id: false }
);

const subscriptionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    prices: [priceSchema],
    features: [featureSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    // Translations for multilingual support
    translations: {
      en: {
        name: String,
        description: String,
        features: [{
          name: String,
          description: String
        }],
      },
      fr: {
        name: String,
        description: String,
        features: [{
          name: String,
          description: String
        }],
      },
      de: {
        name: String,
        description: String,
        features: [{
          name: String,
          description: String
        }],
      },
      es: {
        name: String,
        description: String,
        features: [{
          name: String,
          description: String
        }],
      },
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
subscriptionSchema.plugin(toJSON);
subscriptionSchema.plugin(paginate);

/**
 * Find subscription plan by code
 * @param {string} code - The subscription plan code
 * @returns {Promise<Subscription>}
 */
subscriptionSchema.statics.findByCode = async function (code) {
  return this.findOne({ code, isActive: true });
};

/**
 * Find active plans sorted by order
 * @returns {Promise<Array<Subscription>>}
 */
subscriptionSchema.statics.findActivePlans = async function () {
  return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

/**
 * Get features for subscription in specified language
 * @param {string} lang - The language code
 * @returns {Array<Object>}
 */
subscriptionSchema.methods.getFeaturesInLanguage = function (lang = 'en') {
  if (!this.translations || !this.translations[lang]) {
    return this.features;
  }
  
  const localizedFeatures = this.translations[lang].features || [];
  return this.features.map((feature, index) => {
    const localizedFeature = localizedFeatures[index] || {};
    return {
      ...feature.toObject(),
      name: localizedFeature.name || feature.name,
      description: localizedFeature.description || feature.description,
    };
  });
};

/**
 * @typedef Subscription
 */
const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
