const httpStatus = require('http-status-codes');

/**
 * Creates a standardized success response object.
 *
 * @param {string} message - A human-readable message describing the outcome.
 * @param {*} [data=null] - The data payload of the response, if any.
 * @param {number} [statusCode=httpStatus.OK] - The HTTP status code for the response.
 * @returns {object} The standardized success response object.
 *
 * TODO:
 * - Ensure the data field is always present, even if null, for consistency.
 * - Consider adding a timestamp for when the response was generated.
 */
const successResponse = (message, data = null, statusCode = httpStatus.OK) => {
  return {
    statusCode,
    success: true,
    message,
    // TODO: Implement ensuring the data field is always present
    data: data === undefined ? null : data,
    // TODO: Implement adding a timestamp for when the response was generated
    // timestamp: new Date().toISOString(),
  };
};

/**
 * Creates a standardized error response object.
 *
 * @param {string} message - A human-readable message describing the error.
 * @param {Array<object>|object} [errors=null] - An array or object containing detailed error information.
 * @param {number} [statusCode=httpStatus.BAD_REQUEST] - The HTTP status code for the error.
 * @returns {object} The standardized error response object.
 *
 * TODO:
 * - Ensure the errors field is always present, even if null, for consistency.
 * - Consider adding a unique error code for programmatic error handling.
 */
const errorResponse = (message, errors = null, statusCode = httpStatus.BAD_REQUEST) => {
  return {
    statusCode,
    success: false,
    message,
    // TODO: Implement ensuring the errors field is always present
    errors: errors === undefined ? null : errors,
    // TODO: Implement adding a unique error code for programmatic error handling
    // errorCode: generateUniqueErrorCode(), // Assuming a function exists or needs to be defined
  };
};

module.exports = {
  successResponse,
  errorResponse,
};