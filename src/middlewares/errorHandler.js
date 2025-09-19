const httpStatus = require('http-status-codes');
const logger = require('../utils/logger');
const config = require('../config');
const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

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
    const value = Object.keys(err.keyValue);
    message = `Duplicate field value: ${value}. Please use another value.`;
  }

  // Joi validation errors
  if (err.isJoi) {
    statusCode = httpStatus.BAD_REQUEST;
    message = err.details.map((detail) => detail.message).join(', ');
  }

  res.locals.errorMessage = message;

  const response = {
    statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  } else {
    logger.error(`Error: ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }

  res.status(statusCode).json(errorResponse(message, null, statusCode));
};

const notFound = (req, res, next) => {
  res.status(httpStatus.NOT_FOUND).json(errorResponse(`Not Found - ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFound,
};
