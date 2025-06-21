const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const affiliateLinkSchema = mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    tool: {
      type: String,
      required: true,
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
  },
  {
    _id: true,
    timestamps: true,
  }
);

const translationSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    _id: false,
  }
);

const blogPostSchema = mongoose.Schema(
  {
    // Basic content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 500,
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
    keywords: [String],
    canonicalUrl: String,
    
    // Monetization
    isPremium: {
      type: Boolean,
      default: false,
    },
    affiliateLinks: [affiliateLinkSchema],
    
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    uniqueViews: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    readingTime: Number,
    
    // Status and relationships
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: Date,
    author: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Revenue tracking
    revenueGenerated: {
      type: Number,
      default: 0,
    },
    conversionRate: {
      type: Number,
      default: 0,
    },
    
    // Categories and tags
    category: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Category',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    
    // Featured image
    featuredImage: {
      url: String,
      alt: String,
      caption: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugin that converts mongoose to json
blogPostSchema.plugin(toJSON);
blogPostSchema.plugin(paginate);

// Generate slug from title if not provided
blogPostSchema.pre('validate', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Calculate reading time before saving
blogPostSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Average reading speed: 200 words per minute
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  next();
});

// Set publishedAt when status changes to published
blogPostSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

/**
 * @typedef BlogPost
 */
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;
