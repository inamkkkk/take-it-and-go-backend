const jwt = require('jsonwebtoken');
const httpStatus = require('http-status-codes');
const config = require('../config');
const { errorResponse } = require('../utils/apiResponse');
const { User } = require('../models');

/**
 * Middleware to authenticate incoming requests using JWT.
 * It verifies the JWT provided in the Authorization header.
 * If valid, it attaches the decoded user payload to `req.user`.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('No authentication token provided.'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    // TODO: Consider fetching the user from the database here to ensure the user still exists
    // and to have the full user object available if needed for subsequent middleware/route handlers.
    // For now, we'll just attach the decoded payload.
    req.user = { id: decoded.userId, ...decoded }; // Assuming JWT payload has userId
    next();
  } catch (err) {
    // TODO: Log the error for debugging purposes.
    console.error('JWT Verification Error:', err.message);
    return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('Invalid or expired authentication token.'));
  }
};

/**
 * Middleware to authorize requests based on user roles.
 * It checks if the authenticated user (attached via `authenticate` middleware)
 * has one of the required roles.
 *
 * @param {string|string[]} roles - The role(s) required to access the resource.
 * @returns {function} Express middleware function.
 */
const authorize = (roles = []) => async (req, res, next) => {
  // Ensure roles is always an array
  if (typeof roles === 'string') {
    roles = [roles];
  }

  // Check if user is authenticated and has an ID
  // This check should ideally be redundant if `authenticate` middleware is always used before `authorize`
  if (!req.user || !req.user.id) {
    // TODO: Potentially unify error message with authenticate middleware if this is a common scenario.
    return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('User not authenticated. Please log in.'));
  }

  try {
    // Fetch the user from the database to get their current role and other details.
    // This is important to ensure the user hasn't been deactivated or their role changed.
    const user = await User.findById(req.user.id).select('+role'); // Assuming 'role' field needs explicit selection if it's hidden by default

    if (!user) {
      // User found in JWT but not in database implies an inconsistent state or stale token.
      return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('User not found or account deactivated.'));
    }

    // If specific roles are required, check if the user's role is included.
    // If `roles` is an empty array, it means no specific role is required, and any authenticated user can proceed.
    if (roles.length > 0 && !roles.includes(user.role)) {
      // TODO: Log the authorization attempt for security auditing.
      console.warn(`Unauthorized access attempt by user ${user.id} (role: ${user.role}) for required roles: ${roles.join(', ')}`);
      return res.status(httpStatus.FORBIDDEN).json(errorResponse('Access denied. Insufficient permissions.'));
    }

    // Attach the full user object to the request for convenience in subsequent handlers.
    // Be mindful of sensitive data here; consider selectively attaching properties if necessary.
    req.user = user;
    next();
  } catch (error) {
    // TODO: Log the internal server error for debugging.
    console.error('Authorization Database Error:', error.message);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('An unexpected error occurred during authorization. Please try again later.'));
  }
};

module.exports = {
  authenticate,
  authorize,
};