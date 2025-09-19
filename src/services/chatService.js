const { Chat } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');

/**
 * Creates and stores a new chat message.
 * @param {object} messageData - The data for the chat message.
 * @param {string} messageData.senderId - The ID of the sender.
 * @param {string} messageData.receiverId - The ID of the receiver.
 * @param {string} messageData.message - The content of the message.
 * @param {string} messageData.tripId - The ID of the trip associated with the message.
 * @returns {Promise<object>} A promise that resolves with the created chat message object.
 */
const createChatMessage = async ({ senderId, receiverId, message, tripId }) => {
  // TODO: Implement actual chat message storage
  // This function will be called by the socket handler.
  logger.info(`Saving chat message: From ${senderId} to ${receiverId} in trip ${tripId}`);
  try {
    const chatMessage = await Chat.create({ senderId, receiverId, message, tripId, timestamp: new Date() }); // Added timestamp
    return chatMessage;
  } catch (error) {
    logger.error(`Error creating chat message: ${error.message}`);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save chat message');
  }
};

/**
 * Retrieves chat messages for a given trip ID.
 * @param {string} tripId - The ID of the trip.
 * @param {object} options - Pagination and sorting options.
 * @param {number} [options.limit=10] - The maximum number of messages to retrieve.
 * @param {number} [options.page=1] - The page number to retrieve.
 * @param {string} [options.sortBy='timestamp:asc'] - The field and direction to sort by.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of chat messages.
 */
const getTripMessages = async (tripId, options) => {
  // TODO: Implement retrieval of chat messages for a given tripId
  // options: { limit, page, sortBy }
  logger.info(`Retrieving chat messages for trip: ${tripId}`);

  const { limit = 10, page = 1, sortBy = 'timestamp:asc' } = options;

  const sortOptions = {};
  const [sortField, sortOrder] = sortBy.split(':');
  sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

  try {
    const messages = await Chat.find({ tripId })
      .sort(sortOptions)
      .limit(limit)
      .skip((page - 1) * limit);
    return messages;
  } catch (error) {
    logger.error(`Error retrieving chat messages for trip ${tripId}: ${error.message}`);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve chat messages');
  }
};

/**
 * Marks specific messages as read for a given user and trip.
 * @param {string} tripId - The ID of the trip.
 * @param {string} userId - The ID of the user.
 * @param {Array<string>} messageIds - An array of message IDs to mark as read.
 * @returns {Promise<object>} A promise that resolves with the update operation result.
 */
const markMessagesAsRead = async (tripId, userId, messageIds) => {
  // TODO: Add methods for marking messages as read, deleting messages, etc.
  logger.info(`Marking messages as read for user ${userId} in trip ${tripId}. Message IDs: ${messageIds.join(', ')}`);
  try {
    // Assuming 'readBy' is an array in your Chat model to store user IDs who have read the message
    const result = await Chat.updateMany(
      { _id: { $in: messageIds }, tripId: tripId },
      { $addToSet: { readBy: userId } }
    );
    return result;
  } catch (error) {
    logger.error(`Error marking messages as read for user ${userId} in trip ${tripId}: ${error.message}`);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to mark messages as read');
  }
};

/**
 * Deletes a specific chat message.
 * @param {string} messageId - The ID of the message to delete.
 * @param {string} userId - The ID of the user attempting to delete the message (for authorization).
 * @returns {Promise<object>} A promise that resolves with the delete operation result.
 */
const deleteMessage = async (messageId, userId) => {
  // TODO: Add methods for marking messages as read, deleting messages, etc.
  logger.info(`Deleting message ${messageId} by user ${userId}.`);
  try {
    // Basic authorization: only the sender can delete their own message.
    // You might want to add more sophisticated authorization logic here.
    const message = await Chat.findById(messageId);
    if (!message) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
    }
    if (message.senderId !== userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized to delete this message');
    }

    const result = await Chat.deleteOne({ _id: messageId });
    return result;
  } catch (error) {
    logger.error(`Error deleting message ${messageId} by user ${userId}: ${error.message}`);
    throw error; // Re-throw ApiError or other caught errors
  }
};


module.exports = {
  createChatMessage,
  getTripMessages,
  markMessagesAsRead,
  deleteMessage,
};