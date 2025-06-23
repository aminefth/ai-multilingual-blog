const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../../src/app');
const setupTestDB = require('../../utils/setupTestDB');
const { cache } = require('../../../src/config/redis');
const BlogPostFactory = require('../../factories/blogPostFactory');
const { userOne, insertUsers } = require('../../fixtures/user.fixture');

// Mock Redis cache
jest.mock('../../../src/config/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    client: {
      expire: jest.fn(),
    },
  },
}));

setupTestDB();

describe('Cache middleware', () => {
  describe('GET /api/v1/blog/:id', () => {
    test('should cache response on first request', async () => {
      // Arrange
      await insertUsers([userOne]);
      const blogPost = await new BlogPostFactory({
        author: userOne._id,
        status: 'published',
      }).create();
      cache.get.mockResolvedValue(null); // No cache hit

      // Act
      const res = await request(app).get(`/api/v1/blog/${blogPost._id}`);

      // Assert
      expect(res.status).toBe(httpStatus.OK);
      expect(cache.get).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
      const cacheKey = `cache:/api/v1/blog/${blogPost._id}`;
      expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.anything());
    });

    test('should return cached response on subsequent requests', async () => {
      // Arrange
      await insertUsers([userOne]);
      const blogPost = await new BlogPostFactory({
        author: userOne._id,
        status: 'published',
      }).create();
      const cachedResponse = {
        id: blogPost._id.toString(),
        title: blogPost.title,
        content: blogPost.content,
        author: userOne._id.toString(),
      };
      cache.get.mockResolvedValue(JSON.stringify(cachedResponse));

      // Act
      const res = await request(app).get(`/api/v1/blog/${blogPost._id}`);

      // Assert
      expect(res.status).toBe(httpStatus.OK);
      expect(cache.get).toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled(); // Should not set cache again
      expect(res.body).toEqual(cachedResponse);
    });

    test('should handle cache with different languages', async () => {
      // Arrange
      await insertUsers([userOne]);
      const blogPost = await new BlogPostFactory({
        author: userOne._id,
        status: 'published',
      })
        .withTranslations(['fr'])
        .create();

      cache.get.mockResolvedValue(null); // No cache hit

      // Act
      const res = await request(app)
        .get(`/api/v1/blog/${blogPost._id}`)
        .set('Accept-Language', 'fr');

      // Assert
      expect(res.status).toBe(httpStatus.OK);
      expect(cache.get).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
      const cacheKey = `cache:fr:/api/v1/blog/${blogPost._id}`;
      expect(cache.get).toHaveBeenCalledWith(cacheKey);
    });
  });
});
