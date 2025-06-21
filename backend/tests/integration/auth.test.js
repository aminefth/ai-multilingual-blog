const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { User } = require('../../src/models');
const { userOne, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');
const config = require('../../src/config/config');

setupTestDB();

describe('Auth routes', () => {
  describe('POST /api/v1/auth/register', () => {
    let newUser;
    
    beforeEach(() => {
      newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password1',
      };
    });

    test('should return 201 and successfully register user if request data is valid', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(newUser);
      
      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: newUser.name,
        email: newUser.email,
        role: 'user',
        isEmailVerified: false,
      });

      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: 'user', isEmailVerified: false });
    });

    test('should return 400 error if email is already used', async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      const res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.code).toBe(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password is less than 8 characters', async () => {
      newUser.password = 'pass';

      const res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.code).toBe(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should return 200 and login user if credentials are valid', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/api/v1/auth/login').send(loginCredentials);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: userOne.name,
        email: userOne.email,
        role: userOne.role,
        isEmailVerified: userOne.isEmailVerified,
      });
      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 401 error if password is wrong', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: 'wrongPassword',
      };

      const res = await request(app).post('/api/v1/auth/login').send(loginCredentials);

      expect(res.status).toBe(httpStatus.UNAUTHORIZED);
      expect(res.body.code).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if user does not exist', async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/api/v1/auth/login').send(loginCredentials);

      expect(res.status).toBe(httpStatus.UNAUTHORIZED);
      expect(res.body.code).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('should return 204 if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: userOneAccessToken.refreshToken });

      expect(res.status).toBe(httpStatus.NO_CONTENT);
    });

    test('should return 400 error if refresh token is missing', async () => {
      const res = await request(app).post('/api/v1/auth/logout').send();

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });
  });
});
