const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../../src/app');
const setupTestDB = require('../../utils/setupTestDB');
const { TokenExpiredError } = require('jsonwebtoken');
const { tokenService } = require('../../../src/services');
const { userOne, admin, insertUsers } = require('../../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../../fixtures/token.fixture');

setupTestDB();

describe('Auth middleware', () => {
  beforeEach(async () => {
    await insertUsers([userOne, admin]);
  });

  describe('Authenticate', () => {
    test('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/v1/users/profile');
      expect(res.status).toBe(httpStatus.UNAUTHORIZED);
      expect(res.body.message).toBe('Please authenticate');
    });

    test('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if token is expired', async () => {
      // Mock the verify function to throw TokenExpiredError
      jest.spyOn(tokenService, 'verifyToken').mockImplementationOnce(() => {
        throw new TokenExpiredError('jwt expired', new Date());
      });

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userOneAccessToken}`);
      
      expect(res.status).toBe(httpStatus.UNAUTHORIZED);
      expect(res.body.message).toBe('Token expired');
    });

    test('should successfully authenticate user and set req.user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userOneAccessToken}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty('email', userOne.email);
    });
  });

  describe('Authorize roles', () => {
    test('should return 403 if user does not have required rights', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${userOneAccessToken}`);
      
      expect(res.status).toBe(httpStatus.FORBIDDEN);
      expect(res.body.message).toBe('Forbidden');
    });

    test('should allow access if user has required rights', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminAccessToken}`);
      
      expect(res.status).toBe(httpStatus.OK);
    });
  });

  describe('CSRF protection', () => {
    test('should block requests without CSRF token on sensitive routes', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ 
          currentPassword: 'password1',
          newPassword: 'newpassword123'
        });
      
      // Status code will depend on your CSRF implementation
      expect(res.status).toBeOneOf([
        httpStatus.FORBIDDEN, 
        httpStatus.UNAUTHORIZED, 
        httpStatus.BAD_REQUEST
      ]);
    });
  });

  describe('Rate limiting', () => {
    test('should apply rate limiting on login attempts', async () => {
      const loginCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/login')
            .send(loginCredentials)
        );
      }

      const responses = await Promise.all(requests);
      
      // At least one of the responses should be rate limited
      const rateLimitedResponse = responses.find(res => 
        res.status === httpStatus.TOO_MANY_REQUESTS
      );
      
      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body).toHaveProperty('message');
      expect(rateLimitedResponse.headers).toHaveProperty('retry-after');
    });
  });
});
