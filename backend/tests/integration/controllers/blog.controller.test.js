const request = require('supertest');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const app = require('../../../src/app');
const setupTestDB = require('../../utils/setupTestDB');
const { userOne, insertUsers } = require('../../fixtures/user.fixture');
const { userOneAccessToken } = require('../../fixtures/token.fixture');
const BlogPostFactory = require('../../factories/blogPostFactory');
const { BlogPost } = require('../../../src/models');

setupTestDB();

describe('Blog routes', () => {
  describe('POST /api/v1/blog', () => {
    let newPost;

    beforeEach(() => {
      newPost = {
        title: 'New Blog Post',
        content: 'This is the content of the new blog post.',
        status: 'draft',
      };
    });

    test('should return 201 and create post if data is valid and user is authenticated', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .post('/api/v1/blog')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newPost);

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(newPost.title);
      expect(res.body.author).toBe(userOne._id.toString());

      const dbPost = await BlogPost.findById(res.body.id);
      expect(dbPost).toBeDefined();
      expect(dbPost.title).toBe(newPost.title);
      expect(dbPost.content).toBe(newPost.content);
      expect(dbPost.author.toString()).toBe(userOne._id.toString());
    });

    test('should return 401 if user is not authenticated', async () => {
      const res = await request(app).post('/api/v1/blog').send(newPost);
      expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if title is missing', async () => {
      await insertUsers([userOne]);
      delete newPost.title;

      const res = await request(app)
        .post('/api/v1/blog')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newPost);

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/v1/blog', () => {
    test('should return 200 and paginated list of blog posts', async () => {
      await insertUsers([userOne]);
      await BlogPostFactory.createMany(5, { author: userOne._id, status: 'published' });

      const res = await request(app).get('/api/v1/blog');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty('results');
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.results).toHaveLength(5);
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('totalResults');
    });
    test('should return 200 and empty array if no blog posts', async () => {
      const res = await request(app).get('/api/v1/blog');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.results).toHaveLength(0);
    });

    test('should filter blog posts by category', async () => {
      await insertUsers([userOne]);
      const categoryId = new mongoose.Types.ObjectId();
      await BlogPostFactory.createMany(3, {
        author: userOne._id,
        category: categoryId,
        status: 'published',
      });
      await BlogPostFactory.createMany(2, { author: userOne._id, status: 'published' });

      const res = await request(app).get('/api/v1/blog').query({ category: categoryId.toString() });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.results).toHaveLength(3);
      res.body.results.forEach((post) => {
        expect(post.category).toBe(categoryId.toString());
      });
    });
  });
});
