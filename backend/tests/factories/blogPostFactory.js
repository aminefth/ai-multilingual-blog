const mongoose = require('mongoose');
const faker = require('faker');
const BlogPost = require('../../src/models/blogPost.model');

class BlogPostFactory {
  constructor(overrides = {}) {
    this.data = {
      _id: new mongoose.Types.ObjectId(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(5),
      slug: faker.helpers.slugify(faker.lorem.sentence()).toLowerCase(),
      excerpt: faker.lorem.paragraph(),
      status: 'draft',
      author: overrides.author || new mongoose.Types.ObjectId(),
      isPremium: false,
      tags: [faker.random.word(), faker.random.word()],
      ...overrides
    };
  }
  
  withStatus(status) {
    this.data.status = status;
    if (status === 'published') {
      this.data.publishedAt = faker.date.past();
    }
    return this;
  }
  
  withPremiumContent() {
    this.data.isPremium = true;
    return this;
  }
  
  withAffiliateLinks(count = 2) {
    this.data.affiliateLinks = Array(count).fill().map(() => ({
      _id: new mongoose.Types.ObjectId(),
      text: faker.lorem.sentence(),
      url: faker.internet.url(),
      tool: faker.company.companyName(),
      commission: faker.datatype.float({ min: 5, max: 30 }),
      clicks: faker.datatype.number({ min: 0, max: 1000 }),
      conversions: faker.datatype.number({ min: 0, max: 100 })
    }));
    return this;
  }
  
  withTranslations(languages = ['fr', 'de', 'es']) {
    this.data.translations = {};
    languages.forEach(lang => {
      this.data.translations[lang] = {
        title: `${this.data.title} (${lang})`,
        content: `${this.data.content} (${lang})`,
        excerpt: `${this.data.excerpt} (${lang})`,
        slug: `${this.data.slug}-${lang}`
      };
    });
    return this;
  }
  
  build() {
    return this.data;
  }
  
  async create() {
    const blogPost = new BlogPost(this.data);
    await blogPost.save();
    return blogPost;
  }
  
  static async createMany(count, overrides = {}) {
    const blogPosts = [];
    for (let i = 0; i < count; i++) {
      const post = new BlogPostFactory({...overrides, title: `${overrides.title || 'Post'} ${i+1}`}).build();
      blogPosts.push(post);
    }
    return BlogPost.insertMany(blogPosts);
  }
}

module.exports = BlogPostFactory;
