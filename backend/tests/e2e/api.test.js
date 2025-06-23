const request = require('supertest');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const BlogPostFactory = require('../factories/blogPostFactory');
const { BlogPost, User } = require('../../src/models');

setupTestDB();

describe('E2E API Tests', () => {
  beforeEach(async () => {
    await insertUsers([userOne, admin]);
  });

  describe('Authentication and Authorization', () => {
    test('complete user journey - register, login, access protected routes, logout', async () => {
      // 1. Register a new user
      const newUser = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      };

      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(registerRes.status).toBe(httpStatus.CREATED);
      expect(registerRes.body.user).toBeDefined();
      expect(registerRes.body.tokens).toBeDefined();
      
      const { tokens } = registerRes.body;

      // 2. Access protected route with tokens
      const userProfile = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${tokens.access.token}`);

      expect(userProfile.status).toBe(httpStatus.OK);
      expect(userProfile.body).toHaveProperty('email', newUser.email);

      // 3. Create a blog post using the token
      const blogData = {
        title: 'My E2E Test Blog',
        content: 'This is content created during an E2E test',
        status: 'draft',
      };

      const createBlog = await request(app)
        .post('/api/v1/blog')
        .set('Authorization', `Bearer ${tokens.access.token}`)
        .send(blogData);

      expect(createBlog.status).toBe(httpStatus.CREATED);
      const blogId = createBlog.body.id;

      // 4. Fetch the created blog post
      const getBlog = await request(app)
        .get(`/api/v1/blog/${blogId}`)
        .set('Authorization', `Bearer ${tokens.access.token}`);

      expect(getBlog.status).toBe(httpStatus.OK);
      expect(getBlog.body.title).toBe(blogData.title);
      
      // 5. Update the blog post
      const updateData = { title: 'Updated E2E Blog Title' };
      
      const updateBlog = await request(app)
        .patch(`/api/v1/blog/${blogId}`)
        .set('Authorization', `Bearer ${tokens.access.token}`)
        .send(updateData);

      expect(updateBlog.status).toBe(httpStatus.OK);
      expect(updateBlog.body.title).toBe(updateData.title);
      
      // 6. Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: tokens.refresh.token });

      expect(logoutRes.status).toBe(httpStatus.NO_CONTENT);

      // 7. Verify that we can't access protected routes after logout
      const attemptAfterLogout = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${tokens.access.token}`);

      expect(attemptAfterLogout.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe('Rate limiting', () => {
    test('should enforce rate limits on API endpoints', async () => {
      // Make multiple requests to a rate-limited endpoint in quick succession
      const promises = [];
      const numRequests = 20; // Adjust based on your rate limit configuration
      
      for (let i = 0; i < numRequests; i++) {
        promises.push(
          request(app)
            .get('/api/v1/blog')
            .set('Authorization', `Bearer ${userOneAccessToken}`)
        );
      }
      
      const responses = await Promise.all(promises);
      
      // Check if any responses received rate limit error
      const rateLimitedResponses = responses.filter(
        (res) => res.status === httpStatus.TOO_MANY_REQUESTS
      );
      
      // Verify that rate limiting is working
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Admin operations', () => {
    test('admin can access admin-only routes while regular users cannot', async () => {
      // Create a test blog post
      const blogPost = await new BlogPostFactory({
        author: userOne._id,
        status: 'published',
      }).create();
      
      // Regular user attempts to access admin route
      const userAdminAttempt = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${userOneAccessToken}`);
      
      expect(userAdminAttempt.status).toBe(httpStatus.FORBIDDEN);
      
      // Admin successfully accesses admin route
      const adminAccess = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminAccessToken}`);
      
      expect(adminAccess.status).toBe(httpStatus.OK);
      expect(adminAccess.body).toHaveProperty('userCount');
      expect(adminAccess.body).toHaveProperty('blogPostCount');
    });
  });
});
