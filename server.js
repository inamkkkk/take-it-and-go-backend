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
setupChatSocket(server);

server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.env} mode`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  server.close(() => process.exit(1));
});
