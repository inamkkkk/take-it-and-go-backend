const { Server } = require('socket.io');
const { chatController } = require('../controllers');
const logger = require('../utils/logger');
const config = require('../config');
const jwt = require('jsonwebtoken'); // Import JWT for authentication

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

    // 1. Authenticate JWT token
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      logger.warn(`Socket connection rejected: No token provided from ${socket.id}`);
      socket.disconnect(true); // 2. Disconnect if no token
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      // 3. Attach user information to the socket
      socket.user = decoded;
      logger.info(`Socket authenticated: ${socket.id} for user ${socket.user.userId}`);

      // 4. Implement specific socket event handlers for chat
      chatController.handleChat(socket, io); // Pass the socket and io instance to the controller

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id} for user ${socket.user?.userId || 'unknown'}`);
        // Potentially trigger cleanup logic in the controller if needed
        if (chatController.handleDisconnect) {
          chatController.handleDisconnect(socket, io);
        }
      });

    } catch (err) {
      logger.warn(`Socket authentication failed for ${socket.id}: ${err.message}`);
      socket.disconnect(true); // 2. Disconnect if authentication fails
    }
  });

  logger.info('Socket.IO chat server initialized.');
  return io;
};

module.exports = setupChatSocket;