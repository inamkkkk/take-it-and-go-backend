const logger = require('../utils/logger');
const { chatService } = require('../services');
const jwt = require('jsonwebtoken'); // Assuming JWT for authentication
const { Server } = require('socket.io'); // Assuming socket.io server is available

// TODO: Initialize Notification service if needed
// const notificationService = require('../services/notificationService');

const handleChat = (socket, io) => {
  logger.info(`New chat connection: ${socket.id}`);

  // 1. Authenticate the socket connection (e.g., using JWT from query/headers).
  // Assuming JWT is passed in the 'auth_token' query parameter
  const token = socket.handshake.query.auth_token;
  if (!token) {
    logger.warn(`Authentication failed for socket ${socket.id}: No token provided.`);
    socket.disconnect(true);
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your JWT secret
    socket.user = decoded; // Attach user information to the socket
    logger.info(`Socket ${socket.id} authenticated as user ${decoded.userId}`);
  } catch (err) {
    logger.warn(`Authentication failed for socket ${socket.id}: ${err.message}`);
    socket.disconnect(true);
    return;
  }

  // 2. Join users to specific chat rooms (e.g., based on tripId or conversationId).
  socket.on('joinRoom', async (data) => {
    const { roomId } = data; // Assuming roomId is provided (e.g., tripId or conversationId)
    if (!roomId) {
      logger.warn(`Join room failed for socket ${socket.id}: No roomId provided.`);
      socket.emit('joinRoomError', { message: 'Room ID is required.' });
      return;
    }

    try {
      // TODO: Implement logic to check if the user is allowed to join this room
      // e.g., check if user is part of the trip or conversation
      // For now, we'll assume they can join if they have a valid token.

      socket.join(roomId);
      logger.info(`Socket ${socket.id} (user: ${socket.user.userId}) joined room: ${roomId}`);
      socket.emit('joinedRoom', { roomId });

      // Optionally, broadcast to the room that a user has joined
      socket.to(roomId).emit('userJoined', { userId: socket.user.userId, roomId });

      // 4. Retrieve historical messages for a given room/conversation.
      const messages = await chatService.getMessagesByRoomId(roomId);
      socket.emit('loadMessages', { roomId, messages });

    } catch (error) {
      logger.error(`Error joining room ${roomId} for socket ${socket.id}: ${error.message}`);
      socket.emit('joinRoomError', { message: 'Failed to join room.' });
    }
  });

  // 3. Handle 'sendMessage' event:
  socket.on('sendMessage', async (data) => {
    try {
      const { roomId, message } = data;

      if (!roomId || !message) {
        logger.warn(`Send message failed for socket ${socket.id}: Missing roomId or message.`);
        socket.emit('sendMessageError', { message: 'Room ID and message content are required.' });
        return;
      }

      // 3a. Validate message content (basic check, could be more robust)
      if (message.trim().length === 0) {
        logger.warn(`Send message failed for socket ${socket.id}: Empty message content.`);
        socket.emit('sendMessageError', { message: 'Message cannot be empty.' });
        return;
      }

      // 3b. Save message to MongoDB (Chat model).
      const chatMessage = await chatService.createChatMessage({
        senderId: socket.user.userId, // Use authenticated user ID
        roomId,
        message,
      });

      logger.info(`Message sent to room ${roomId} by ${socket.user.userId}: ${message}`);

      // 3c. Emit message to the relevant chat room/participants.
      // Emit to everyone in the room EXCEPT the sender
      socket.to(roomId).emit('receiveMessage', chatMessage);
      // Emit to sender for immediate feedback (optional, but good UX)
      socket.emit('receiveMessage', chatMessage);

      // 8. Integrate with Notification service for offline messages.
      // TODO: Implement notification logic.
      // For example, find users in the room who are currently offline and send them a notification.
      // const roomParticipants = io.sockets.adapter.rooms.get(roomId) || new Set();
      // const offlineParticipants = Array.from(roomParticipants).filter(id => !io.of('/').sockets.get(id)?.user); // Simple check, needs refinement
      // if (offlineParticipants.length > 0) {
      //   await notificationService.sendChatMessageNotification(chatMessage, offlineParticipants);
      // }

    } catch (error) {
      logger.error(`Error sending message in room ${data.roomId || 'unknown'} from socket ${socket.id}: ${error.message}`);
      socket.emit('sendMessageError', { message: 'Failed to send message.' });
    }
  });

  // 5. Handle 'typing' / 'read' receipts events.
  socket.on('typing', (data) => {
    const { roomId } = data;
    if (!roomId) return;
    socket.to(roomId).emit('userTyping', { userId: socket.user.userId, roomId });
  });

  socket.on('stopTyping', (data) => {
    const { roomId } = data;
    if (!roomId) return;
    socket.to(roomId).emit('userStoppedTyping', { userId: socket.user.userId, roomId });
  });

  socket.on('messageRead', async (data) => {
    const { roomId, messageId } = data;
    if (!roomId || !messageId) return;
    try {
      // TODO: Update message status to 'read' in the database.
      // await chatService.markMessageAsRead(roomId, messageId, socket.user.userId);
      logger.info(`Message ${messageId} in room ${roomId} marked as read by ${socket.user.userId}`);
      // Broadcast read status to other participants if needed
      socket.to(roomId).emit('messageReadConfirmation', { roomId, messageId, readerId: socket.user.userId });
    } catch (error) {
      logger.error(`Error marking message ${messageId} as read in room ${roomId} for socket ${socket.id}: ${error.message}`);
    }
  });

  // 6. Manage user presence (online/offline).
  // When a user connects, they are online. When they disconnect, they are offline.
  // We can leverage socket.io's connection/disconnect events.
  // TODO: Implement more sophisticated presence management if needed (e.g., last seen).

  socket.on('disconnect', (reason) => {
    logger.info(`Chat connection disconnected: ${socket.id} (Reason: ${reason})`);
    if (socket.user) {
      logger.info(`User ${socket.user.userId} disconnected.`);
      // TODO: Broadcast user offline status to relevant rooms/users
      // Example: Iterate through rooms the user was in and emit 'userOffline'
      // For now, this is a basic disconnect logging.
    }
  });

  // 7. Ensure proper error handling and logging.
  // Handled within individual event listeners using try-catch blocks.
};

module.exports = {
  handleChat,
};