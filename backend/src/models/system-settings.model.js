const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const systemSettingsSchema = mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    lastModifiedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
systemSettingsSchema.plugin(toJSON);

/**
 * Get a setting by key
 * @param {string} key - Setting key
 * @returns {Promise<Object>}
 */
systemSettingsSchema.statics.getByKey = async function (key) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : null;
};

/**
 * Set a setting value
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 * @param {string} [description] - Setting description
 * @param {string} [category] - Setting category
 * @param {boolean} [isPublic] - Whether setting is public
 * @param {ObjectId} [userId] - User ID who modified the setting
 * @returns {Promise<Object>}
 */
systemSettingsSchema.statics.set = async function (key, value, { description, category, isPublic, userId } = {}) {
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  
  const update = {
    value,
    lastModifiedBy: userId,
  };
  
  if (description !== undefined) update.description = description;
  if (category !== undefined) update.category = category;
  if (isPublic !== undefined) update.isPublic = isPublic;

  return this.findOneAndUpdate({ key }, update, options);
};

/**
 * Get all settings by category
 * @param {string} category - Category name
 * @param {boolean} [publicOnly=false] - Whether to return only public settings
 * @returns {Promise<Array>}
 */
systemSettingsSchema.statics.getByCategory = async function (category, publicOnly = false) {
  const query = { category };
  if (publicOnly) query.isPublic = true;
  
  return this.find(query);
};

/**
 * @typedef SystemSettings
 */
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;
