require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const config = require('./src/config');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const setupChatSocket = require('./src/sockets/chatSocket');

// Connect to MongoDB
connectDB();

const server = http.createServer(app);

// Setup Socket.io for chat
// TODO: Implement graceful shutdown for Socket.io connections.
const io = setupChatSocket(server); // Assign the returned io instance

server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.env} mode`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, err); // Log the full error object for better debugging
  server.close(() => {
    logger.info('Shutting down server due to unhandled rejection.');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, err); // Log the full error object for better debugging
  // TODO: Implement graceful shutdown for Socket.io connections before exiting.
  // For now, we'll close the server and exit.
  server.close(() => {
    logger.info('Shutting down server due to uncaught exception.');
    process.exit(1);
  });
});

// TODO: Implement graceful shutdown for the HTTP server when SIGTERM or SIGINT signals are received.
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Shutting down gracefully.');
  server.close(() => {
    logger.info('HTTP server closed.');
    // TODO: Ensure Socket.io connections are also closed here.
    // For example, io.close() or iterating through sockets and disconnecting.
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received. Shutting down gracefully.');
  server.close(() => {
    logger.info('HTTP server closed.');
    // TODO: Ensure Socket.io connections are also closed here.
    process.exit(0);
  });
});