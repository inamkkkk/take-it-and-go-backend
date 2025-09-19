const morgan = require('morgan');
const config = require('../config');
const logger = require('../utils/logger');

// TODO: Implement the 'message' token to log the error message from res.locals.errorMessage.
// If res.locals.errorMessage is not present, log an empty string.
morgan.token('message', (req, res) => {
  // Check if errorMessage exists in res.locals and return it, otherwise return an empty string.
  return res.locals.errorMessage || '';
});

// TODO: Implement the getIpFormat function to conditionally return ':remote-addr - ' based on the environment.
// Production environment should include the IP address, while others should not.
const getIpFormat = () => (config.env === 'production' ? ':remote-addr - ' : '');

// TODO: Define the successResponseFormat string.
// It should include the IP format (if applicable), HTTP method, URL, status code, and response time.
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;

// TODO: Define the errorResponseFormat string.
// It should include the IP format (if applicable), HTTP method, URL, status code, response time, and the custom 'message' token.
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

// TODO: Create and configure the successHandler middleware using morgan.
// It should skip logs for responses with status codes >= 400 and stream logs to logger.info.
const successHandler = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

// TODO: Create and configure the errorHandler middleware using morgan.
// It should skip logs for responses with status codes < 400 and stream logs to logger.error.
const errorHandler = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

// TODO: Export the successHandler and errorHandler.
module.exports = {
  successHandler,
  errorHandler,
};