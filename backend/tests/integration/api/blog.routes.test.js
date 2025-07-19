const request = require('supertest');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const app = require('../../../src/app');
const setupTestDB = require('../../utils/setupTestDB');
const { userOne, userTwo, admin, insertUsers } = require('../../fixtures/user.fixture');
const {
  userOneAccessToken,
  userTwoAccessToken,
  adminAccessToken,
} = require('../../fixtures/token.fixture');
const BlogPostFactory = require('../../factories/blogPostFactory');
const { BlogPost } = require('../../../src/models');
const redis = require('../../../src/config/redis');
const translationService = require('../../../src/services/translation.service');

// Mock Redis
jest.mock('../../../src/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

// Mock Translation Service
jest.mock('../../../src/services/translation.service', () => ({
  translateContent: jest.fn(),
  translateBlogPostFields: jest.fn(),
}));

setupTestDB();

describe('Blog API', () => {
  let newBlogPost;

  beforeEach(async () => {
    await insertUsers([userOne, userTwo, admin]);

    // Create a blog post for testing
    newBlogPost = {
      title: 'Test Blog Post',
      content: 'This is a test blog post content',
      excerpt: 'Test excerpt',
      slug: 'test-blog-post',
      tags: ['test', 'blog'],
      author: userOne._id,
      status: 'published',
      language: 'en',
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /v1/blog-posts', () => {
    test('should create a blog post if request data is valid and user is authenticated', async () => {
      const res = await request(app)
        .post('/v1/blog-posts')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newBlogPost)
        .expect(httpStatus.CREATED);

      expect(res.body).toEqual({
        id: expect.any(String),
        title: newBlogPost.title,
        content: newBlogPost.content,
        excerpt: newBlogPost.excerpt,
        slug: newBlogPost.slug,
        tags: newBlogPost.tags,
        author: userOne._id.toHexString(),
        status: newBlogPost.status,
        language: newBlogPost.language,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test('should return 401 if user is not authenticated', async () => {
      await request(app).post('/v1/blog-posts').send(newBlogPost).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if request data is invalid', async () => {
      await request(app)
        .post('/v1/blog-posts')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          // Missing required fields
          tags: ['test'],
        })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/blog-posts', () => {
    let blog1;
    let blog2;

    beforeEach(async () => {
      blog1 = await BlogPostFactory.createBlogPost({
        author: userOne._id,
        language: 'en',
        status: 'published',
        title: 'First Test Post',
      });

      blog2 = await BlogPostFactory.createBlogPost({
        author: userTwo._id,
        language: 'fr',
        status: 'published',
        title: 'Second Test Post',
      });
    });

    test('should return 200 and apply default query options', async () => {
      const res = await request(app).get('/v1/blog-posts').expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      });

      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(blog1._id.toHexString());
      expect(res.body.results[1].id).toBe(blog2._id.toHexString());
    });

    test('should return 200 and correctly filter by language', async () => {
      const res = await request(app)
        .get('/v1/blog-posts')
        .query({ language: 'fr' })
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      });

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(blog2._id.toHexString());
      expect(res.body.results[0].language).toBe('fr');
    });

    test('should use Redis cache when available', async () => {
      // Setup cache mock to return data
      const cachedData = {
        results: [{ id: blog1._id.toHexString(), title: 'Cached Post' }],
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      };

      redis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const res = await request(app).get('/v1/blog-posts').expect(httpStatus.OK);

      expect(redis.get).toHaveBeenCalledWith(expect.stringContaining('blog_posts_query_'));
      expect(res.body).toEqual(cachedData);
    });
  });

  describe('GET /v1/blog-posts/:id', () => {
    let blog;

    beforeEach(async () => {
      blog = await BlogPostFactory.createBlogPost({
        author: userOne._id,
        language: 'en',
        status: 'published',
      });
    });

    test('should return 200 and the blog post object if data is ok', async () => {
      const res = await request(app).get(`/v1/blog-posts/${blog._id}`).expect(httpStatus.OK);

      expect(res.body).toEqual({
        id: blog._id.toHexString(),
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        slug: blog.slug,
        tags: blog.tags,
        author: userOne._id.toHexString(),
        status: blog.status,
        language: blog.language,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test('should return 404 if blog post is not found', async () => {
      await request(app)
        .get(`/v1/blog-posts/${mongoose.Types.ObjectId()}`)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should retrieve translated content when language param is provided', async () => {
      const targetLanguage = 'es';
      const translatedTitle = 'Título traducido';
      const translatedContent = 'Contenido traducido';

      translationService.translateBlogPostFields.mockResolvedValueOnce({
        ...blog.toObject(),
        title: translatedTitle,
        content: translatedContent,
      });

      const res = await request(app)
        .get(`/v1/blog-posts/${blog._id}`)
        .query({ language: targetLanguage })
        .expect(httpStatus.OK);

      expect(translationService.translateBlogPostFields).toHaveBeenCalledWith(
        expect.any(Object),
        blog.language,
        targetLanguage,
      );

      expect(res.body.title).toBe(translatedTitle);
      expect(res.body.content).toBe(translatedContent);
    });

    test('should use Redis cache for translated content', async () => {
      const targetLanguage = 'fr';
      const cacheKey = `blog_post_${blog._id}_${targetLanguage}`;
      const cachedBlog = {
        ...blog.toObject(),
        id: blog._id.toHexString(),
        title: 'Titre mis en cache',
        content: 'Contenu mis en cache',
      };

      redis.get.mockResolvedValueOnce(JSON.stringify(cachedBlog));

      const res = await request(app)
        .get(`/v1/blog-posts/${blog._id}`)
        .query({ language: targetLanguage })
        .expect(httpStatus.OK);

      expect(redis.get).toHaveBeenCalledWith(cacheKey);
      expect(res.body.title).toBe(cachedBlog.title);
      expect(res.body.content).toBe(cachedBlog.content);

      // Translation service should not be called if cache hit
      expect(translationService.translateBlogPostFields).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /v1/blog-posts/:id', () => {
    let blogPost;

    beforeEach(async () => {
      blogPost = await BlogPostFactory.createBlogPost({
        author: userOne._id,
        language: 'en',
        status: 'draft',
      });
    });

    test('should return 200 and successfully update blog post if data is ok', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        status: 'published',
      };

      const res = await request(app)
        .patch(`/v1/blog-posts/${blogPost._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateData)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        id: blogPost._id.toHexString(),
        title: updateData.title,
        content: updateData.content,
        excerpt: blogPost.excerpt,
        slug: blogPost.slug,
        tags: blogPost.tags,
        author: userOne._id.toHexString(),
        status: updateData.status,
        language: blogPost.language,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify Redis cache was invalidated
      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining(`blog_post_${blogPost._id}`));
    });

    test('should return 401 if user is not authenticated', async () => {
      await request(app)
        .patch(`/v1/blog-posts/${blogPost._id}`)
        .send({ title: 'New Title' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if user is not the author', async () => {
      await request(app)
        .patch(`/v1/blog-posts/${blogPost._id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`) // Different user
        .send({ title: 'New Title' })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should allow admin to update any blog post', async () => {
      const updateData = { title: 'Admin Updated' };

      await request(app)
        .patch(`/v1/blog-posts/${blogPost._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(httpStatus.OK);
    });
  });

  describe('DELETE /v1/blog-posts/:id', () => {
    let blogPost;

    beforeEach(async () => {
      blogPost = await BlogPostFactory.createBlogPost({
        author: userOne._id,
      });
    });

    test('should return 204 if deleted successfully', async () => {
      await request(app)
        .delete(`/v1/blog-posts/${blogPost._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      // Verify the blog post is deleted
      const dbBlogPost = await BlogPost.findById(blogPost._id);
      expect(dbBlogPost).toBeNull();

      // Verify Redis cache was invalidated
      expect(redis.del).toHaveBeenCalled();
    });

    test('should return 401 if user is not authenticated', async () => {
      await request(app).delete(`/v1/blog-posts/${blogPost._id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if user is not the author', async () => {
      await request(app)
        .delete(`/v1/blog-posts/${blogPost._id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 204 if admin deletes the blog post', async () => {
      await request(app)
        .delete(`/v1/blog-posts/${blogPost._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);
    });

    test('should return 404 if blog post does not exist', async () => {
      await request(app)
        .delete(`/v1/blog-posts/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
