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
    // TODO: Add a 'readAt' field of type Date, which will be set when the notification is marked as read.
    // This field should be optional and nullable.
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TODO: Add a pre-save hook to automatically set 'readAt' to the current date and time
// if 'read' is set to true and 'readAt' is not already set.
notificationSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});


/**
 * @typedef Notification
 */
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;