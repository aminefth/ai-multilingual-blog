const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const translationSchema = mongoose.Schema(
  {
    sourceId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'BlogPost',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['en', 'fr', 'de', 'es'],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    translationQuality: {
      type: Number,
      min: 0,
      max: 10,
      default: 8,
    },
    lastReviewer: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    reviewDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
translationSchema.plugin(toJSON);
translationSchema.plugin(paginate);

// Create compound index for sourceId + language
translationSchema.index({ sourceId: 1, language: 1 }, { unique: true });

/**
 * Get translations for a blog post
 * @param {ObjectId} sourceId - Blog post ID
 * @returns {Promise<Array>}
 */
translationSchema.statics.findBySourceId = async function (sourceId) {
  return this.find({ sourceId });
};

/**
 * Check if a translation exists for a blog post in a specific language
 * @param {ObjectId} sourceId - Blog post ID
 * @param {string} language - Language code
 * @returns {Promise<boolean>}
 */
translationSchema.statics.exists = async function (sourceId, language) {
  const count = await this.countDocuments({ sourceId, language });
  return count > 0;
};

/**
 * @typedef Translation
 */
const Translation = mongoose.model('Translation', translationSchema);

module.exports = Translation;
