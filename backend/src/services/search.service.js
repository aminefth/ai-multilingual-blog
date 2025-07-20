const { MeiliSearch } = require('meilisearch');
const { BlogPost, Category } = require('../models');
const config = require('../config/config');

class SearchService {
  constructor() {
    this.client = new MeiliSearch({
      host: config.meilisearch.host || 'http://localhost:7700',
      apiKey: config.meilisearch.apiKey || null,
    });

    this.postsIndex = 'blog_posts';
    this.categoriesIndex = 'categories';

    this.initializeIndexes();
  }

  async initializeIndexes() {
    try {
      // Initialize blog posts index
      await this.client.createIndex(this.postsIndex, { primaryKey: 'id' });
      const postsIndex = this.client.index(this.postsIndex);

      // Configure searchable attributes
      await postsIndex.updateSearchableAttributes([
        'title',
        'content',
        'excerpt',
        'tags',
        'category',
        'author',
      ]);

      // Configure filterable attributes
      await postsIndex.updateFilterableAttributes([
        'status',
        'category',
        'tags',
        'language',
        'isPremium',
        'publishedAt',
      ]);

      // Configure sortable attributes
      await postsIndex.updateSortableAttributes(['publishedAt', 'updatedAt', 'views', 'likes']);

      // Initialize categories index
      await this.client.createIndex(this.categoriesIndex, { primaryKey: 'id' });
      const categoriesIndex = this.client.index(this.categoriesIndex);

      await categoriesIndex.updateSearchableAttributes(['name', 'description', 'slug']);

      await categoriesIndex.updateFilterableAttributes(['language', 'parentId']);
    } catch (error) {
      // Indexes might already exist, which is fine
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }

  async indexBlogPost(blogPost) {
    try {
      const postsIndex = this.client.index(this.postsIndex);

      const document = {
        id: blogPost._id.toString(),
        title: blogPost.title,
        content: blogPost.content,
        excerpt: blogPost.excerpt,
        slug: blogPost.slug,
        tags: blogPost.tags || [],
        category: blogPost.category?.name || '',
        categorySlug: blogPost.category?.slug || '',
        author: blogPost.author?.name || '',
        status: blogPost.status,
        language: blogPost.language,
        isPremium: blogPost.isPremium || false,
        publishedAt: blogPost.publishedAt,
        updatedAt: blogPost.updatedAt,
        views: blogPost.views || 0,
        likes: blogPost.likes || 0,
        featuredImage: blogPost.featuredImage,
        seo: {
          metaTitle: blogPost.seo?.metaTitle,
          metaDescription: blogPost.seo?.metaDescription,
        },
      };

      await postsIndex.addDocuments([document]);
      return true;
    } catch (error) {
      throw new Error(`Failed to index blog post: ${error.message}`);
    }
  }

  async searchBlogPosts(query, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        filters = 'status = "published"',
        sort = ['publishedAt:desc'],
        attributesToHighlight = ['title', 'content', 'excerpt'],
        language = null,
      } = options;

      const searchIndex = this.client.index(this.postsIndex);

      let searchFilters = filters;
      if (language) {
        searchFilters = searchFilters
          ? `${searchFilters} AND language = "${language}"`
          : `language = "${language}"`;
      }

      const searchOptions = {
        limit,
        offset,
        attributesToHighlight,
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      };

      if (searchFilters) {
        searchOptions.filter = searchFilters;
      }

      if (sort && sort.length > 0) {
        searchOptions.sort = sort;
      }

      const results = await searchIndex.search(query, searchOptions);

      return {
        hits: results.hits,
        totalHits: results.estimatedTotalHits,
        query: results.query,
        processingTimeMs: results.processingTimeMs,
        limit: results.limit,
        offset: results.offset,
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async searchCategories(query, options = {}) {
    try {
      const {
        limit = 10,
        language = null,
        attributesToHighlight = ['name', 'description'],
      } = options;

      const searchIndex = this.client.index(this.categoriesIndex);

      const searchOptions = {
        limit,
        attributesToHighlight,
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      };

      if (language) {
        searchOptions.filter = `language = "${language}"`;
      }

      const results = await searchIndex.search(query, searchOptions);

      return {
        hits: results.hits,
        totalHits: results.estimatedTotalHits,
        query: results.query,
        processingTimeMs: results.processingTimeMs,
        limit: results.limit,
      };
    } catch (error) {
      throw new Error(`Category search failed: ${error.message}`);
    }
  }

  async getSuggestions(query, limit = 5) {
    try {
      const results = await this.searchBlogPosts(query, {
        limit,
        attributesToHighlight: [],
      });

      return results.hits.map((hit) => ({
        id: hit.id,
        title: hit.title,
        slug: hit.slug,
        category: hit.category,
        type: 'blog_post',
      }));
    } catch (error) {
      throw new Error(`Failed to get suggestions: ${error.message}`);
    }
  }

  async reindexAllBlogPosts() {
    try {
      const blogPosts = await BlogPost.find({ status: 'published' })
        .populate('category', 'name slug')
        .populate('author', 'name')
        .lean();

      const postsIndex = this.client.index(this.postsIndex);
      await postsIndex.deleteAllDocuments();

      const documents = blogPosts.map((post) => ({
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        slug: post.slug,
        tags: post.tags || [],
        category: post.category?.name || '',
        categorySlug: post.category?.slug || '',
        author: post.author?.name || '',
        status: post.status,
        language: post.language,
        isPremium: post.isPremium || false,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        views: post.views || 0,
        likes: post.likes || 0,
        featuredImage: post.featuredImage,
        seo: {
          metaTitle: post.seo?.metaTitle,
          metaDescription: post.seo?.metaDescription,
        },
      }));

      if (documents.length > 0) {
        await postsIndex.addDocuments(documents);
      }

      return { indexed: documents.length };
    } catch (error) {
      throw new Error(`Failed to reindex blog posts: ${error.message}`);
    }
  }

  async reindexAllCategories() {
    try {
      const categories = await Category.find().lean();

      const categoriesIndex = this.client.index(this.categoriesIndex);
      await categoriesIndex.deleteAllDocuments();

      const documents = categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        slug: category.slug,
        language: category.language,
        parentId: category.parentId?.toString() || null,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }));

      if (documents.length > 0) {
        await categoriesIndex.addDocuments(documents);
      }

      return { indexed: documents.length };
    } catch (error) {
      throw new Error(`Failed to reindex categories: ${error.message}`);
    }
  }

  async getIndexStats() {
    try {
      const postsIndex = this.client.index(this.postsIndex);
      const categoriesIndex = this.client.index(this.categoriesIndex);

      const [postsStats, categoriesStats] = await Promise.all([
        postsIndex.getStats(),
        categoriesIndex.getStats(),
      ]);

      return {
        blogPosts: {
          numberOfDocuments: postsStats.numberOfDocuments,
          isIndexing: postsStats.isIndexing,
          fieldDistribution: postsStats.fieldDistribution,
        },
        categories: {
          numberOfDocuments: categoriesStats.numberOfDocuments,
          isIndexing: categoriesStats.isIndexing,
          fieldDistribution: categoriesStats.fieldDistribution,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get index stats: ${error.message}`);
    }
  }
}

module.exports = new SearchService();
