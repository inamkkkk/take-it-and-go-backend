const httpStatus = require('http-status-codes');
const { notificationService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const sendNotification = async (req, res) => {
  try {
    // TODO: Implement logic to send a notification to a user.
    // Steps:
    // 1. Validate input (userId, type, message, optional data).
    // 2. Determine notification channel (e.g., push notification via FCM, in-app notification).
    // 3. Use Firebase Cloud Messaging (FCM) for push notifications (integration: Firebase Cloud Messaging).
    // 4. Save notification record in the database (Notification model for in-app history).
    // 5. Return success status.
    logger.info(`Send notification request: ${JSON.stringify(req.body)}`);
    const { userId, type, message, data } = req.body;
    await notificationService.sendNotificationToUser(userId, type, message, data);
    res.status(httpStatus.OK).json(successResponse('Notification sent successfully'));
  } catch (error) {
    logger.error(`Send notification error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(error.message));
  }
};

module.exports = {
  sendNotification,
};
