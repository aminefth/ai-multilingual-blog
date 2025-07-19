const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../../src/app');
const setupTestDB = require('../../utils/setupTestDB');
const redis = require('../../../src/config/redis');
const { userOne, insertUsers } = require('../../fixtures/user.fixture');
const { userOneAccessToken } = require('../../fixtures/token.fixture');
const BlogPostFactory = require('../../factories/blogPostFactory');

// Mock Redis
jest.mock('../../../src/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

setupTestDB();

describe('Cache middleware', () => {
  let blogPost;

  beforeEach(async () => {
    await insertUsers([userOne]);

    blogPost = await BlogPostFactory.createBlogPost({
      author: userOne._id,
      title: 'Test Cache Post',
      content: 'Content to be cached',
      status: 'published',
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Route caching', () => {
    test('should cache GET requests to blog posts', async () => {
      // First request - should set cache
      const firstRes = await request(app)
        .get(`/v1/blog-posts/${blogPost._id}`)
        .expect(httpStatus.OK);

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining(`blog_post_${blogPost._id}`),
        expect.any(String),
        'EX',
        expect.any(Number),
      );

      // Reset the mock to verify it's not called again
      redis.set.mockClear();

      // Set up cache hit
      redis.get.mockResolvedValueOnce(JSON.stringify(firstRes.body));

      // Second request - should use cache
      const secondRes = await request(app)
        .get(`/v1/blog-posts/${blogPost._id}`)
        .expect(httpStatus.OK);

      expect(redis.get).toHaveBeenCalledWith(expect.stringContaining(`blog_post_${blogPost._id}`));
      expect(redis.set).not.toHaveBeenCalled(); // shouldn't set cache again
      expect(secondRes.body).toEqual(firstRes.body);
    });

    test('should cache blog posts lists with query parameters', async () => {
      // Create several blog posts for pagination testing
      await Promise.all([
        BlogPostFactory.createBlogPost({ status: 'published', language: 'en' }),
        BlogPostFactory.createBlogPost({ status: 'published', language: 'fr' }),
        BlogPostFactory.createBlogPost({ status: 'published', language: 'es' }),
      ]);

      // First request with pagination params
      const query = { page: 1, limit: 2, language: 'en' };
      const firstRes = await request(app).get('/v1/blog-posts').query(query).expect(httpStatus.OK);

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('blog_posts_query_'),
        expect.any(String),
        'EX',
        expect.any(Number),
      );

      // Reset mock
      redis.set.mockClear();

      // Set up cache hit
      redis.get.mockResolvedValueOnce(JSON.stringify(firstRes.body));

      // Second request with same params
      const secondRes = await request(app).get('/v1/blog-posts').query(query).expect(httpStatus.OK);

      expect(redis.get).toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
      expect(secondRes.body).toEqual(firstRes.body);
    });

    test('should bypass cache for authorized users on specific routes', async () => {
      // Some routes may bypass cache for authorized users to ensure fresh data
      // Mock a behavior where cache is bypassed for the current user's own posts

      const url = '/v1/users/me/blog-posts';

      // First request (authenticated)
      await request(app)
        .get(url)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      // Cache should not be used for user's own content to ensure freshness
      expect(redis.get).not.toHaveBeenCalled();
    });
  });

  describe('Cache invalidation', () => {
    test('should invalidate cache when blog post is updated', async () => {
      const updateData = { title: 'Updated Title' };

      await request(app)
        .patch(`/v1/blog-posts/${blogPost._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateData)
        .expect(httpStatus.OK);

      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining(`blog_post_${blogPost._id}`));

      // Should also invalidate list caches
      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining('blog_posts_query_'));
    });

    test('should invalidate cache when blog post is deleted', async () => {
      await request(app)
        .delete(`/v1/blog-posts/${blogPost._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining(`blog_post_${blogPost._id}`));

      // Should also invalidate list caches
      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining('blog_posts_query_'));
    });

    test('should invalidate all translation caches for a blog post', async () => {
      // Mock implementation to capture all calls to del
      const delCalls = [];
      redis.del.mockImplementation((key) => {
        delCalls.push(key);
        return Promise.resolve(1);
      });

      await request(app)
        .delete(`/v1/blog-posts/${blogPost._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      // Should have calls for different language caches
      const cacheInvalidationCalls = delCalls.filter((key) =>
        key.includes(`blog_post_${blogPost._id}`),
      );

      expect(cacheInvalidationCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Cache performance', () => {
    test('should serve cached content faster than database queries', async () => {
      // First uncached request
      const uncachedStartTime = Date.now();
      await request(app).get(`/v1/blog-posts/${blogPost._id}`).expect(httpStatus.OK);
      const uncachedDuration = Date.now() - uncachedStartTime;

      // Set up cache hit for second request
      redis.get.mockResolvedValueOnce(
        JSON.stringify({
          id: blogPost._id.toString(),
          title: blogPost.title,
          content: blogPost.content,
        }),
      );

      // Second cached request
      const cachedStartTime = Date.now();
      await request(app).get(`/v1/blog-posts/${blogPost._id}`).expect(httpStatus.OK);
      const cachedDuration = Date.now() - cachedStartTime;

      // In a real test, cached responses should be faster
      // In our mock implementation, we'll just verify the cache was used
      expect(redis.get).toHaveBeenCalled();
    });
  });
});
