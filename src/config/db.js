const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // TODO: Implement graceful shutdown for MongoDB connection.
    // Consider using mongoose.connection.on('disconnected', ...) for logging.

    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    logger.info('MongoDB Connected successfully!');

    // Add event listener for disconnections for better error handling and logging
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected.');
    });

  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    // TODO: Refine error handling for connection failures.
    // Consider implementing retry logic before exiting.
    process.exit(1); // Exit process with failure
  }
};

// TODO: Add a function to disconnect from MongoDB gracefully.
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected successfully!');
  } catch (err) {
    logger.error(`MongoDB disconnection error: ${err.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB, // Export the disconnect function
};