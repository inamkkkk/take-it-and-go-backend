const { Notification, User } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const config = require('../config');
const admin = require('firebase-admin'); // Import firebase-admin SDK

// Initialize Firebase Admin SDK if server key is configured
if (config.integrations.fcm.serverKey && config.integrations.fcm.projectId && config.integrations.fcm.privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.integrations.fcm.projectId,
        clientEmail: config.integrations.fcm.clientEmail,
        privateKey: config.integrations.fcm.privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines in private key
      }),
      // databaseURL is optional, but can be useful for other Firebase services
    });
    logger.info('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    logger.error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    // Decide if this should be a critical error or if the app can continue without FCM
  }
} else {
  logger.warn('FCM configuration is incomplete. Push notifications will not be sent.');
}

const sendNotificationToUser = async (userId, type, message, data = {}) => {
  // TODO: Implement sending notifications, possibly via FCM
  // Steps:
  // 1. Find the user to get their notification tokens (e.g., FCM device tokens).
  // 2. Use Firebase Cloud Messaging (FCM) to send push notifications (integration: Firebase Cloud Messaging).
  //    - Requires setting up Firebase Admin SDK.
  // 3. Create an in-app notification record in the database (Notification model).
  // 4. Handle different notification types (e.g., sending specific data payloads).

  logger.info(`Attempting to send notification of type '${type}' to user ${userId}: ${message}`);

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found for notification');
    }

    // Assuming user model has a field like 'fcmTokens' which is an array of strings
    const userFcmTokens = user.fcmTokens || [];

    // 3. Create an in-app notification record in the database (Notification model).
    const newNotification = await Notification.create({
      userId,
      type,
      message,
      data,
    });

    // 2. Use Firebase Cloud Messaging (FCM) to send push notifications
    if (admin.apps.length > 0 && userFcmTokens.length > 0) {
      // 4. Handle different notification types (e.g., sending specific data payloads).
      const fcmPayload = {
        tokens: userFcmTokens, // Send to all registered tokens for the user
        notification: {
          title: 'Take iT & Go Notification', // Consider making this configurable or dynamic
          body: message,
        },
        data: {
          type: type,
          notificationId: newNotification._id.toString(),
          ...data, // Include any additional data passed to the function
        },
      };

      try {
        const response = await admin.messaging().sendEachForMulticast(fcmPayload);
        logger.info(`FCM notification sent to user ${userId}. Success count: ${response.successCount}, Failure count: ${response.failureCount}`);

        // Handle potential errors or invalid tokens
        if (response.failures.length > 0) {
          logger.warn(`FCM send failures for user ${userId}:`, response.failures);
          // TODO: Implement logic to remove invalid FCM tokens from the user's profile
          response.failures.forEach((failure, idx) => {
            if (failure.response && failure.response.error && failure.response.error.code === 'registration-token-not-registered') {
              const invalidToken = userFcmTokens[idx];
              logger.info(`Removing invalid FCM token: ${invalidToken} for user ${userId}`);
              // Example: await User.updateOne({ _id: userId }, { $pull: { fcmTokens: invalidToken } });
            }
          });
        }
      } catch (fcmError) {
        logger.error(`Error sending FCM notification to user ${userId}: ${fcmError.message}`);
        // Decide if this error should prevent the in-app notification from being sent
        // For now, we continue to return the in-app notification even if FCM fails
      }
    } else if (admin.apps.length === 0) {
      logger.warn(`Firebase Admin SDK not initialized. Cannot send FCM notification to user ${userId}.`);
    } else {
      logger.info(`User ${userId} has no FCM tokens registered. Skipping FCM push.`);
    }

    return newNotification;
  } catch (error) {
    logger.error(`Error processing notification for user ${userId}: ${error.message}`);
    // If the error is an ApiError already, re-throw it. Otherwise, wrap it.
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send notification');
  }
};

module.exports = {
  sendNotificationToUser,
};