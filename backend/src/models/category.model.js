const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const translationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false }
);

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Multi-language support
    translations: {
      en: translationSchema,
      fr: translationSchema,
      de: translationSchema,
      es: translationSchema,
    },
    // SEO
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    // Hierarchy
    parent: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Category',
      default: null,
    },
    ancestors: [{
      _id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Category',
      },
      name: String,
      slug: String,
    }],
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Display order
    sortOrder: {
      type: Number,
      default: 0,
    },
    // Featured image
    image: {
      url: String,
      alt: String,
    },
    // Stats
    postCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);

// Generate slug from name if not provided
categorySchema.pre('validate', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Update ancestors when parent changes
categorySchema.pre('save', async function(next) {
  const category = this;
  if (category.isModified('parent')) {
    if (!category.parent) {
      // If parent is removed, clear ancestors
      category.ancestors = [];
    } else {
      // If parent is set or changed, update ancestors
      const parent = await category.constructor.findById(category.parent);
      if (!parent) {
        return next(new Error('Parent category not found'));
      }
      
      const ancestors = [
        {
          _id: parent._id,
          name: parent.name,
          slug: parent.slug,
        }
      ];
      
      // Add parent's ancestors
      if (parent.ancestors && parent.ancestors.length > 0) {
        ancestors.push(...parent.ancestors);
      }
      
      category.ancestors = ancestors;
    }
  }
  next();
});

/**
 * Find categories by parent
 * @param {ObjectId} [parentId] - The parent category id (null for root categories)
 * @returns {Promise<Category[]>}
 */
categorySchema.statics.findByParent = async function(parentId = null) {
  return this.find({ parent: parentId, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

/**
 * Increment post count
 * @returns {Promise<void>}
 */
categorySchema.methods.incrementPostCount = async function() {
  this.postCount += 1;
  return this.save();
};

/**
 * Decrement post count
 * @returns {Promise<void>}
 */
categorySchema.methods.decrementPostCount = async function() {
  if (this.postCount > 0) {
    this.postCount -= 1;
    return this.save();
  }
  return Promise.resolve();
};

/**
 * @typedef Category
 */
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
