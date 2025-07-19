const moment = require('moment');
const config = require('../../src/config/config');
const { tokenService } = require('../../src/services');
const { userOne, userTwo, admin } = require('./user.fixture');

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const userOneAccessToken = tokenService.generateToken(userOne._id, accessTokenExpires, 'access');
const userOneRefreshToken = tokenService.generateToken(userOne._id, accessTokenExpires, 'refresh');
const userTwoAccessToken = tokenService.generateToken(userTwo._id, accessTokenExpires, 'access');
const adminAccessToken = tokenService.generateToken(
  admin?._id || userTwo._id,
  accessTokenExpires,
  'access',
);

module.exports = {
  userOneAccessToken,
  userOneRefreshToken,
  userTwoAccessToken,
  adminAccessToken,
};
