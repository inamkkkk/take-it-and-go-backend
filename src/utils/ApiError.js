class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors; // TODO: Allow passing an array of specific error details for more granular debugging.

    // Capture the stack trace, excluding the constructor call.
    // This ensures the stack trace points to where the ApiError was actually thrown.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      // Fallback for environments that don't support captureStackTrace
      this.stack = (new Error(message)).stack;
    }
  }
}

module.exports = ApiError;