const httpStatus = require('http-status');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const tokenService = require('../../../src/services/token.service');
const emailService = require('../../../src/services/email.service');
const authService = require('../../../src/services/auth.service');
const userService = require('../../../src/services/user.service');
const ApiError = require('../../../src/utils/ApiError');
const { User, Token } = require('../../../src/models');
const { tokenTypes } = require('../../../src/config/tokens');

jest.mock('../../../src/models/token.model');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/services/token.service');
jest.mock('../../../src/services/email.service');
jest.mock('../../../src/services/user.service');

describe('Auth service', () => {
  describe('loginUserWithEmailAndPassword', () => {
    test('should return user and tokens if email and password match', async () => {
      const user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        isEmailVerified: true,
      };
      
      // Mock the user model findOne
      User.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({
          _id: user._id,
          email: user.email,
          password: await bcrypt.hash(user.password, 8),
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPasswordMatch: jest.fn().mockResolvedValue(true),
          toJSON: jest.fn().mockReturnValue({
            _id: user._id,
            email: user.email,
          }),
        }),
      }));

      const tokens = { access: {}, refresh: {} };
      tokenService.generateAuthTokens.mockResolvedValue(tokens);

      const result = await authService.loginUserWithEmailAndPassword(user.email, user.password);
      
      expect(User.findOne).toHaveBeenCalledWith({ email: user.email });
      expect(result.user).toBeDefined();
      expect(result.tokens).toBe(tokens);
    });

    test('should throw an error if email does not exist', async () => {
      User.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      await expect(authService.loginUserWithEmailAndPassword('nonexistent@example.com', 'password123'))
        .rejects.toThrow(new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password'));
    });

    test('should throw an error if password is incorrect', async () => {
      const user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        password: 'password123',
      };
      
      // Mock the user model findOne
      User.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({
          _id: user._id,
          email: user.email,
          password: await bcrypt.hash(user.password, 8),
          isPasswordMatch: jest.fn().mockResolvedValue(false),
        }),
      }));

      await expect(authService.loginUserWithEmailAndPassword(user.email, 'wrongpassword'))
        .rejects.toThrow(new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password'));
    });

    test('should throw an error if user email is not verified', async () => {
      const user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false,
      };
      
      // Mock the user model findOne
      User.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({
          _id: user._id,
          email: user.email,
          password: await bcrypt.hash(user.password, 8),
          isEmailVerified: user.isEmailVerified,
          isPasswordMatch: jest.fn().mockResolvedValue(true),
        }),
      }));

      await expect(authService.loginUserWithEmailAndPassword(user.email, user.password))
        .rejects.toThrow(new ApiError(httpStatus.UNAUTHORIZED, 'Please verify your email'));
    });
  });

  describe('logout', () => {
    test('should call Token.deleteOne with the refresh token', async () => {
      const refreshToken = 'some-refresh-token';
      const tokenDoc = {
        token: refreshToken,
        user: new mongoose.Types.ObjectId(),
        type: tokenTypes.REFRESH,
        blacklisted: false,
      };

      Token.findOne.mockResolvedValue(tokenDoc);
      Token.deleteOne.mockResolvedValue({});

      await authService.logout(refreshToken);

      expect(Token.deleteOne).toHaveBeenCalledWith({ token: refreshToken });
    });

    test('should throw an error if refresh token is not found', async () => {
      Token.findOne.mockResolvedValue(null);

      await expect(authService.logout('nonexistent-token'))
        .rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, 'Token not found'));
    });
  });

  describe('refreshAuth', () => {
    test('should return new tokens if refresh token is valid', async () => {
      const userId = new mongoose.Types.ObjectId();
      const refreshToken = 'valid-refresh-token';
      const user = {
        _id: userId,
        email: 'test@example.com',
      };
      const tokenDoc = {
        token: refreshToken,
        user: userId,
        type: tokenTypes.REFRESH,
        blacklisted: false,
        expires: moment().add(30, 'minutes').toDate(),
      };
      const newTokens = {
        access: { token: 'new-access-token', expires: moment().add(15, 'minutes').toDate() },
        refresh: { token: 'new-refresh-token', expires: moment().add(30, 'days').toDate() },
      };

      Token.findOne.mockResolvedValue(tokenDoc);
      tokenService.verifyToken.mockResolvedValue({ sub: userId });
      userService.getUserById.mockResolvedValue({
        _id: userId,
        email: user.email,
        toJSON: jest.fn().mockReturnValue(user),
      });
      tokenService.generateAuthTokens.mockResolvedValue(newTokens);

      const result = await authService.refreshAuth(refreshToken);

      expect(tokenService.verifyToken).toHaveBeenCalledWith(refreshToken, tokenTypes.REFRESH);
      expect(userService.getUserById).toHaveBeenCalledWith(userId);
      expect(tokenService.generateAuthTokens).toHaveBeenCalledWith(expect.objectContaining({ _id: userId }));
      expect(result.user).toEqual(user);
      expect(result.tokens).toEqual(newTokens);
    });

    test('should throw an error if refresh token is blacklisted', async () => {
      const refreshToken = 'blacklisted-token';
      const tokenDoc = {
        token: refreshToken,
        type: tokenTypes.REFRESH,
        blacklisted: true,
      };

      Token.findOne.mockResolvedValue(tokenDoc);

      await expect(authService.refreshAuth(refreshToken))
        .rejects.toThrow(new ApiError(httpStatus.UNAUTHORIZED, 'Token is blacklisted'));
    });

    test('should throw an error if refresh token is expired', async () => {
      const refreshToken = 'expired-token';

      Token.findOne.mockResolvedValue({
        token: refreshToken,
        type: tokenTypes.REFRESH,
        blacklisted: false,
        expires: moment().subtract(1, 'day').toDate(),
      });

      await expect(authService.refreshAuth(refreshToken))
        .rejects.toThrow(new ApiError(httpStatus.UNAUTHORIZED, 'Token expired'));
    });
  });

  describe('resetPassword', () => {
    test('should reset password and delete all reset tokens for the user', async () => {
      const resetPasswordToken = 'valid-reset-token';
      const userId = new mongoose.Types.ObjectId();
      const newPassword = 'new-password123';
      const tokenDoc = {
        token: resetPasswordToken,
        user: userId,
        type: tokenTypes.RESET_PASSWORD,
        blacklisted: false,
        expires: moment().add(10, 'minutes').toDate(),
      };
      const user = {
        _id: userId,
        email: 'test@example.com',
      };

      Token.findOne.mockResolvedValue(tokenDoc);
      tokenService.verifyToken.mockResolvedValue({ sub: userId });
      userService.getUserById.mockResolvedValue(user);
      userService.updateUserById.mockResolvedValue(user);
      Token.deleteMany.mockResolvedValue({});

      await authService.resetPassword(resetPasswordToken, newPassword);

      expect(tokenService.verifyToken).toHaveBeenCalledWith(resetPasswordToken, tokenTypes.RESET_PASSWORD);
      expect(userService.updateUserById).toHaveBeenCalledWith(userId, { password: newPassword });
      expect(Token.deleteMany).toHaveBeenCalledWith({ user: userId, type: tokenTypes.RESET_PASSWORD });
    });

    test('should throw error if reset password token is invalid', async () => {
      Token.findOne.mockResolvedValue(null);

      await expect(authService.resetPassword('invalid-token', 'newpassword123'))
        .rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, 'Token not found'));
    });
  });

  describe('verifyEmail', () => {
    test('should verify user email and delete verification tokens', async () => {
      const verifyEmailToken = 'valid-verify-token';
      const userId = new mongoose.Types.ObjectId();
      const tokenDoc = {
        token: verifyEmailToken,
        user: userId,
        type: tokenTypes.VERIFY_EMAIL,
        blacklisted: false,
        expires: moment().add(10, 'minutes').toDate(),
      };
      const user = {
        _id: userId,
        email: 'test@example.com',
        isEmailVerified: false,
      };

      Token.findOne.mockResolvedValue(tokenDoc);
      tokenService.verifyToken.mockResolvedValue({ sub: userId });
      userService.getUserById.mockResolvedValue(user);
      userService.updateUserById.mockResolvedValue({ ...user, isEmailVerified: true });
      Token.deleteMany.mockResolvedValue({});

      await authService.verifyEmail(verifyEmailToken);

      expect(tokenService.verifyToken).toHaveBeenCalledWith(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
      expect(userService.updateUserById).toHaveBeenCalledWith(userId, { isEmailVerified: true });
      expect(Token.deleteMany).toHaveBeenCalledWith({ user: userId, type: tokenTypes.VERIFY_EMAIL });
    });

    test('should throw error if verify email token is invalid', async () => {
      Token.findOne.mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token'))
        .rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, 'Token not found'));
    });
  });

  describe('changePassword', () => {
    test('should update password if current password is correct', async () => {
      const userId = new mongoose.Types.ObjectId();
      const currentPassword = 'current-password';
      const newPassword = 'new-password';
      const user = {
        _id: userId,
        email: 'test@example.com',
        password: await bcrypt.hash(currentPassword, 8),
        isPasswordMatch: jest.fn().mockResolvedValue(true),
      };

      userService.getUserById.mockResolvedValue(user);
      userService.updateUserById.mockResolvedValue(user);

      await authService.changePassword(userId, currentPassword, newPassword);

      expect(userService.getUserById).toHaveBeenCalledWith(userId);
      expect(user.isPasswordMatch).toHaveBeenCalledWith(currentPassword);
      expect(userService.updateUserById).toHaveBeenCalledWith(userId, { password: newPassword });
    });

    test('should throw error if current password is incorrect', async () => {
      const userId = new mongoose.Types.ObjectId();
      const user = {
        _id: userId,
        email: 'test@example.com',
        isPasswordMatch: jest.fn().mockResolvedValue(false),
      };

      userService.getUserById.mockResolvedValue(user);

      await expect(authService.changePassword(userId, 'wrong-password', 'new-password'))
        .rejects.toThrow(new ApiError(httpStatus.UNAUTHORIZED, 'Current password is incorrect'));
    });
  });
});
