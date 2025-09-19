const logger = require('../utils/logger');
const { chatService } = require('../services');

const handleChat = (socket) => {
  logger.info(`New chat connection: ${socket.id}`);

  // TODO: Implement chat logic for WebSocket connections
  // Steps:
  // 1. Authenticate the socket connection (e.g., using JWT from query/headers).
  // 2. Join users to specific chat rooms (e.g., based on tripId or conversationId).
  // 3. Handle 'sendMessage' event:
  //    - Validate message content.
  //    - Save message to MongoDB (Chat model).
  //    - Emit message to the relevant chat room/participants.
  // 4. Handle 'loadMessages' event:
  //    - Retrieve historical messages for a given room/conversation.
  // 5. Handle 'typing' / 'read' receipts events.
  // 6. Manage user presence (online/offline).
  // 7. Ensure proper error handling and logging.
  // 8. Integrate with Notification service for offline messages.

  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, receiverId, message, tripId } = data;
      // Placeholder for message storage and broadcast
      const chatMessage = await chatService.createChatMessage({ senderId, receiverId, message, tripId });
      logger.info(`Message received: ${message} from ${senderId} to ${receiverId} for trip ${tripId}`);
      socket.to(tripId).emit('receiveMessage', chatMessage); // Emit to room
      socket.emit('receiveMessage', chatMessage); // Emit to sender for immediate feedback
    } catch (error) {
      logger.error(`Error sending message: ${error.message}`);
      socket.emit('chatError', { message: 'Failed to send message.' });
    }
  });

  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    logger.info(`${socket.id} joined room: ${roomName}`);
    socket.emit('joinedRoom', roomName);
  });

  socket.on('disconnect', () => {
    logger.info(`Chat connection disconnected: ${socket.id}`);
  });

  // safe placeholder response (for REST, though this is WS)
  // If this was a REST endpoint, it would return:
  // res.json({ status: "stub", message: "Chat logic pending in WebSocket handler" });
};

module.exports = {
  handleChat,
};
