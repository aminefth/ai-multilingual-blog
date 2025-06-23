const moment = require('moment');
const config = require('../../src/config/config');
const { tokenService } = require('../../src/services');
const { userOne } = require('./user.fixture');

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const userOneAccessToken = tokenService.generateToken(userOne._id, accessTokenExpires, 'access');
const userOneRefreshToken = tokenService.generateToken(userOne._id, accessTokenExpires, 'refresh');

module.exports = {
  userOneAccessToken,
  userOneRefreshToken,
};
