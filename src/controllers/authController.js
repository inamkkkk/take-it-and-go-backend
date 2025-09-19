const httpStatus = require('http-status-codes');
const { authService, userService, tokenService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError'); // Assuming ApiError is a custom error class

const signup = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    const tokens = await authService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).json(successResponse('User registered successfully', { user, tokens }));
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    // Check if it's a known API error to provide specific status code
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(errorResponse(error.message, error.errors, error.statusCode));
    }
    res.status(httpStatus.BAD_REQUEST).json(errorResponse('An error occurred during registration.'));
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
    // Check if it's a known API error to provide specific status code
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(errorResponse(error.message, error.errors, error.statusCode));
    }
    res.status(httpStatus.UNAUTHORIZED).json(errorResponse('Invalid email or password.'));
  }
};

const forgotPassword = async (req, res) => {
  try {
    // 1. Validate email input.
    const { email } = req.body;
    if (!email) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email is required');
    }

    // 2. Find user by email.
    const user = await userService.getUserByEmail(email);
    if (!user) {
      // For security reasons, do not reveal if the email exists or not
      logger.warn(`Forgot password attempt for non-existent email: ${email}`);
      return res.status(httpStatus.OK).json(successResponse('If an account with that email exists, a password reset link has been sent.'));
    }

    // 3. Generate a password reset token.
    const resetToken = await tokenService.generateResetPasswordToken(user);

    // 4. Store the token (e.g., in user model, with expiration).
    // This is typically handled by generateResetPasswordToken and the tokenService.

    // 5. Send an email to the user with a reset link containing the token.
    // TODO: Implement email sending logic using a mail service.
    // Example: await emailService.sendResetPasswordEmail(user.email, resetToken);
    logger.info(`Generated reset token for user: ${user.email}`);

    res.status(httpStatus.OK).json(successResponse('If an account with that email exists, a password reset link has been sent.'));
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(errorResponse(error.message, error.errors, error.statusCode));
    }
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('An error occurred while processing your request.'));
  }
};

const resetPassword = async (req, res) => {
  try {
    // 1. Validate new password and reset token from request.
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Reset token and new password are required');
    }

    // 2. Find user by the reset token and ensure it's not expired.
    const user = await tokenService.verifyResetPasswordToken(resetToken);
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired reset token');
    }

    // 3. Hash and update the user's password.
    await userService.updateUserById(user.id, { password });

    // 4. Invalidate the reset token.
    await tokenService.removeToken(user.id, resetToken, 'passwordReset'); // Assuming a method to remove specific tokens

    logger.info(`Password reset successfully for user: ${user.email}`);
    res.status(httpStatus.OK).json(successResponse('Password has been reset successfully.'));
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(errorResponse(error.message, error.errors, error.statusCode));
    }
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('An error occurred while resetting your password.'));
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
};