const httpStatus = require('http-status-codes');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing
const ApiError = require('../utils/ApiError');
const jwtUtil = require('../utils/jwt');
const { User } = require('../models');
const logger = require('../utils/logger');
const crypto = require('crypto'); // Import crypto for token generation

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

/**
 * Generates a reset password token and stores it in the user document.
 * @param {User} user - The user object.
 * @returns {Promise<string>} The generated reset password token.
 */
const generateResetPasswordToken = async (user) => {
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  // Token expires in 10 minutes (adjust as needed)
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  await user.save();
  return user.resetPasswordToken;
};

/**
 * Verifies a reset password token and updates the user's password.
 * @param {string} token - The reset password token.
 * @param {string} newPassword - The new password for the user.
 * @throws {ApiError} If the token is invalid or expired.
 */
const verifyResetPasswordToken = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset token');
  }

  user.password = await bcrypt.hash(newPassword, 8); // Hash the new password
  user.resetPasswordToken = undefined; // Invalidate the token
  user.resetPasswordExpires = undefined;
  await user.save();
};


module.exports = {
  loginUserWithEmailAndPassword,
  generateAuthTokens,
  generateResetPasswordToken,
  verifyResetPasswordToken,
};