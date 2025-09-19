const { Chat } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');

const createChatMessage = async ({ senderId, receiverId, message, tripId }) => {
  // TODO: Implement actual chat message storage
  // This function will be called by the socket handler.
  logger.info(`Saving chat message: From ${senderId} to ${receiverId} in trip ${tripId}`);
  try {
    const chatMessage = await Chat.create({ senderId, receiverId, message, tripId });
    return chatMessage;
  } catch (error) {
    logger.error(`Error creating chat message: ${error.message}`);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save chat message');
  }
};

const getTripMessages = async (tripId, options) => {
  // TODO: Implement retrieval of chat messages for a given tripId
  // options: { limit, page, sortBy }
  logger.info(`Retrieving chat messages for trip: ${tripId}`);
  const messages = await Chat.find({ tripId }).sort({ timestamp: 1 }).limit(options.limit).skip((options.page - 1) * options.limit);
  return messages;
};

// TODO: Add methods for marking messages as read, deleting messages, etc.

module.exports = {
  createChatMessage,
  getTripMessages,
};
