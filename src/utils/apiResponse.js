const httpStatus = require('http-status-codes');

const successResponse = (message, data = null, statusCode = httpStatus.OK) => {
  return {
    statusCode,
    success: true,
    message,
    data,
  };
};

const errorResponse = (message, errors = null, statusCode = httpStatus.BAD_REQUEST) => {
  return {
    statusCode,
    success: false,
    message,
    errors,
  };
};

module.exports = {
  successResponse,
  errorResponse,
};
