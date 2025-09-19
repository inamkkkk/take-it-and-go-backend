const passport = require('passport'); // Not using passport, but example how one might integrate
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status-codes');
const config = require('../config');
const { errorResponse } = require('../utils/apiResponse');
const { User } = require('../models');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('No authentication token provided.'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('Invalid or expired authentication token.'));
  }
};

const authorize = (roles = []) => async (req, res, next) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  if (!req.user || !req.user.id) {
    return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('User not authenticated.'));
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('User not found.'));
    }

    if (roles.length && !roles.includes(user.role)) {
      return res.status(httpStatus.FORBIDDEN).json(errorResponse('Access denied. Insufficient permissions.'));
    }

    // Attach full user object to request if needed, or just keep ID/role
    req.user = user;
    next();
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('Authentication error.'));
  }
};

module.exports = {
  authenticate,
  authorize,
};
