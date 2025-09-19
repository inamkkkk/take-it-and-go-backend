const { Server } = require('socket.io');
const { chatController } = require('../controllers');
const logger = require('../utils/logger');
const config = require('../config');

const setupChatSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: config.env === 'development' ? ['http://localhost:3000', 'http://localhost:5000'] : '*', // Adjust origin for production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    // TODO: Implement Socket.IO authentication and authorization
    // Steps:
    // 1. When a client connects, try to authenticate their JWT token (passed in handshake auth or query).
    // 2. If authentication fails, disconnect the socket.
    // 3. If successful, attach user information (e.g., userId, role) to the socket object.
    // 4. Implement specific socket event handlers for chat (e.g., 'joinRoom', 'sendMessage').

    logger.info(`Socket connected: ${socket.id}`);
    chatController.handleChat(socket); // Pass the socket to the controller for specific chat logic

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO chat server initialized.');
  return io;
};

module.exports = setupChatSocket;
