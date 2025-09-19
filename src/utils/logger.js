const winston = require('winston');
const config = require('../config');

// TODO: Implement a custom log format for better readability and structure
// TODO: Add transports for file logging (e.g., in a 'logs' directory)
// TODO: Implement log level filtering based on environment variables if needed
// TODO: Consider adding a timestamp to log messages
// TODO: Add a mechanism to handle unhandled exceptions and rejections

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    // Assign the stack trace to the message if it's an Error object
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const timestampFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss'
});

const customLogFormat = winston.format.printf(({ level, message, timestamp, ...args }) => {
  let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (Object.keys(args).length) {
    logMessage += ` ${JSON.stringify(args)}`;
  }
  return logMessage;
});


const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    timestampFormat, // Add timestamp
    enumerateErrorFormat(),
    config.env === 'development' ? winston.format.colorize() : winston.format.uncolorize(), // Colorize only in development
    winston.format.splat(),
    customLogFormat // Use the custom format
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'], // Errors go to stderr
    }),
    // TODO: Uncomment and configure file transport when implemented
    /*
    new winston.transports.File({
      filename: 'logs/app.log', // Log file path
      level: 'info', // Log info level and above to file
      handleExceptions: true, // Log exceptions to file
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep up to 5 log files
    }),
    */
  ],
  exceptionHandlers: [ // Handle unhandled exceptions
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    // TODO: Add file transport for exceptions if file logging is enabled
    /*
    new winston.transports.File({
      filename: 'logs/exceptions.log',
    }),
    */
  ],
  rejectionHandlers: [ // Handle unhandled promise rejections
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    // TODO: Add file transport for rejections if file logging is enabled
    /*
    new winston.transports.File({
      filename: 'logs/rejections.log',
    }),
    */
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// TODO: Implement a stream for HTTP request logging if needed
/*
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};
*/

module.exports = logger;