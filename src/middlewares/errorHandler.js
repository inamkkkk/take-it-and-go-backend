const httpStatus = require('http-status-codes');
const logger = require('../utils/logger');
const config = require('../config');
const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // TODO: Add more specific error handling for common error types.
  // For example, handle authentication errors, authorization errors, etc.

  if (!statusCode) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Invalid ID format';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = httpStatus.BAD_REQUEST;
    const field = Object.keys(err.keyValue)[0]; // Get the first duplicated field
    const value = err.keyValue[field];
    message = `Duplicate field value: ${field} with value "${value}". Please use another value.`;
  }

  // Joi validation errors
  if (err.isJoi) {
    statusCode = httpStatus.BAD_REQUEST;
    message = err.details.map((detail) => detail.message).join('. ');
  }

  // TODO: If your application uses a specific error class (e.g., ApiError),
  // you might want to add handling for it here to extract relevant information.
  // Example:
  // if (err instanceof ApiError) {
  //   statusCode = err.statusCode;
  //   message = err.message;
  //   // Potentially other properties from ApiError
  // }

  res.locals.errorMessage = message;

  const response = {
    statusCode,
    message,
    // Include stack trace only in development environment
    ...(config.env === 'development' && { stack: err.stack }),
  };

  // Log errors based on the environment
  if (config.env === 'development') {
    logger.error('Unhandled Error:', err); // Log the full error object in development
  } else {
    // In production, log a more concise message including request details
    logger.error(`Error: ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }

  // Send the error response
  res.status(statusCode).json(errorResponse(message, null, statusCode));
};

const notFound = (req, res, next) => {
  const message = `Not Found - ${req.originalUrl}`;
  logger.warn(`Attempted to access non-existent route: ${req.originalUrl}`);
  res.status(httpStatus.NOT_FOUND).json(errorResponse(message, null, httpStatus.NOT_FOUND));
};

module.exports = {
  errorHandler,
  notFound,
};