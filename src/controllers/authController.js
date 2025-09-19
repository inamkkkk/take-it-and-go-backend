const httpStatus = require('http-status-codes');
const { authService, userService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const signup = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    const tokens = await authService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).json(successResponse('User registered successfully', { user, tokens }));
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await authService.generateAuthTokens(user);
    res.status(httpStatus.OK).json(successResponse('Logged in successfully', { user, tokens }));
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(httpStatus.UNAUTHORIZED).json(errorResponse(error.message));
  }
};

const forgotPassword = async (req, res) => {
  // TODO: Implement forgot password logic
  // Steps:
  // 1. Validate email input.
  // 2. Find user by email.
  // 3. Generate a password reset token.
  // 4. Store the token (e.g., in user model, with expiration).
  // 5. Send an email to the user with a reset link containing the token.
  logger.info(`Forgot password request for email: ${req.body.email}`);
  res.status(httpStatus.OK).json(successResponse('If an account with that email exists, a password reset link has been sent.'));
};

const resetPassword = async (req, res) => {
  // TODO: Implement reset password logic
  // Steps:
  // 1. Validate new password and reset token from request.
  // 2. Find user by the reset token and ensure it's not expired.
  // 3. Hash and update the user's password.
  // 4. Invalidate the reset token.
  logger.info('Reset password request received');
  res.status(httpStatus.OK).json(successResponse('Password has been reset successfully.'));
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
};
