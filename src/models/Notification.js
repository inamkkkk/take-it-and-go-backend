const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'delivery_update',
        'payment_status',
        'new_match',
        'chat_message',
        'system_alert',
        'admin_message',
        'verification_status',
        'dispute_update',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Object, // Any additional data related to the notification (e.g., tripId, disputeId)
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef Notification
 */
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
