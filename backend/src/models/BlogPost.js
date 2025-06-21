const mongoose = require('mongoose');

// BlogPost Schema - Production Ready Version
const blogPostSchema = new mongoose.Schema({
  // Content
  title: { type: String, required: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, maxlength: 500 },
  
  // Multi-language
  translations: {
    en: { title: String, content: String, excerpt: String, slug: String },
    fr: { title: String, content: String, excerpt: String, slug: String },
    de: { title: String, content: String, excerpt: String, slug: String },
    es: { title: String, content: String, excerpt: String, slug: String }
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  keywords: [String],
  canonicalUrl: String,
  
  // Monetization
  isPremium: { type: Boolean, default: false },
  affiliateLinks: [{
    text: String,
    url: String,
    tool: String,
    commission: Number,
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  }],
  
  // Analytics
  views: { type: Number, default: 0 },
  uniqueViews: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  readingTime: Number,
  
  // Status
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Revenue
  revenueGenerated: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ 'translations.en.slug': 1 });
blogPostSchema.index({ views: -1 });
blogPostSchema.index({ revenueGenerated: -1 });

// Virtual fields
blogPostSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

// Methods
blogPostSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

blogPostSchema.methods.recordAffiliateClick = async function(linkId) {
  const link = this.affiliateLinks.id(linkId);
  if (link) {
    link.clicks += 1;
    await this.save();
    return true;
  }
  return false;
};

blogPostSchema.methods.recordAffiliateConversion = async function(linkId, amount) {
  const link = this.affiliateLinks.id(linkId);
  if (link) {
    link.conversions += 1;
    this.revenueGenerated += amount;
    await this.save();
    return true;
  }
  return false;
};

// Statics
blogPostSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug });
};

blogPostSchema.statics.findByTranslatedSlug = function(slug, language) {
  const query = {};
  query[`translations.${language}.slug`] = slug;
  return this.findOne(query);
};

blogPostSchema.statics.findMostViewed = function(limit = 5) {
  return this.find({ status: 'published' })
    .sort({ views: -1 })
    .limit(limit);
};

blogPostSchema.statics.findMostRevenue = function(limit = 5) {
  return this.find({ status: 'published' })
    .sort({ revenueGenerated: -1 })
    .limit(limit);
};

// Pre-save hook to calculate reading time
blogPostSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Average reading speed: 200 words per minute
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;
