const { Notification, User } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const config = require('../config');

const sendNotificationToUser = async (userId, type, message, data = {}) => {
  // TODO: Implement sending notifications, possibly via FCM
  // Steps:
  // 1. Find the user to get their notification tokens (e.g., FCM device tokens).
  // 2. Use Firebase Cloud Messaging (FCM) to send push notifications (integration: Firebase Cloud Messaging).
  //    - Requires setting up Firebase Admin SDK.
  // 3. Create an in-app notification record in the database (Notification model).
  // 4. Handle different notification types (e.g., sending specific data payloads).

  logger.info(`Sending notification of type '${type}' to user ${userId}: ${message}`);

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found for notification');
    }

    // Save to in-app notifications
    const newNotification = await Notification.create({
      userId,
      type,
      message,
      data,
    });

    // TODO: Implement FCM logic here
    if (config.integrations.fcm.serverKey) {
      // Example FCM payload (simplified)
      const fcmPayload = {
        to: 'user_device_token_here', // Retrieve from user model or a separate token store
        notification: {
          title: 'Take iT & Go Notification',
          body: message,
        },
        data: { 
          type: type,
          notificationId: newNotification._id.toString(),
          ...data 
        },
      };
      
      // TODO: Make an actual request to FCM API using a library like `node-gcm` or `firebase-admin`
      logger.warn('FCM integration is stubbed. Notification not actually sent via FCM.');
      // Example:
      // const admin = require('firebase-admin');
      // admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: '...' });
      // await admin.messaging().send(fcmPayload);

    } else {
      logger.warn('FCM server key not configured. Push notifications will not be sent.');
    }

    return newNotification;
  } catch (error) {
    logger.error(`Error sending notification to user ${userId}: ${error.message}`);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send notification');
  }
};

module.exports = {
  sendNotificationToUser,
};
