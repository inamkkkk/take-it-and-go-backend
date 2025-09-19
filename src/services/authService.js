const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const jwtUtil = require('../utils/jwt');
const { User } = require('../models');
const logger = require('../utils/logger');

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

const generateAuthTokens = async (user) => {
  const accessToken = jwtUtil.generateToken(user.id, user.role);
  // For production, you might also generate a refresh token and store it in Redis.
  return { access: { token: accessToken, expires: jwtUtil.getAccessTokenExpires() } };
};

// TODO: Implement forgot password / reset password token generation and verification
// - generateResetPasswordToken(user): creates a unique token, stores it in user object, sets expiration
// - verifyResetPasswordToken(token, newPassword): verifies token, hashes new password, updates user, invalidates token

module.exports = {
  loginUserWithEmailAndPassword,
  generateAuthTokens,
};
