const express = require('express');
const validate = require('../middlewares/validator');
const { notificationController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const sendNotificationSchema = {
  body: Joi.object().keys({
    userId: Joi.string().required().hex().length(24), // ObjectId of the recipient
    type: Joi.string().valid(
      'delivery_update',
      'payment_status',
      'new_match',
      'chat_message',
      'system_alert',
      'admin_message',
      'verification_status',
      'dispute_update'
    ).required(),
    message: Joi.string().min(5).required(),
    data: Joi.object().optional(), // Optional payload for specific notification types
  }),
};

// Schema for getting user notifications
const getUserNotificationsSchema = {
  params: Joi.object().keys({
    userId: Joi.string().required().hex().length(24), // ObjectId of the user
  }),
};

// Schema for marking a notification as read
const markAsReadSchema = {
  params: Joi.object().keys({
    notificationId: Joi.string().required().hex().length(24), // ObjectId of the notification
  }),
};

router.post('/send', authenticate, authorize(['admin', 'shipper', 'traveler']), validate(sendNotificationSchema), notificationController.sendNotification);

// TODO: Add routes for getting user notifications, marking as read, etc.
// Implement getUserNotifications route
router.get('/user/:userId', authenticate, authorize(['shipper', 'traveler', 'admin']), validate(getUserNotificationsSchema), notificationController.getUserNotifications);

// Implement markAsRead route
router.patch('/:notificationId/read', authenticate, authorize(['shipper', 'traveler']), validate(markAsReadSchema), notificationController.markAsRead);

module.exports = router;