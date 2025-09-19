const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    shipperId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    travelerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple nulls for pending payments
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'disputed', 'refunded', 'failed'],
      default: 'pending',
    },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'other'],
      required: false, // Could be added after gateway initiation
    },
    paymentDetails: {
      type: Object, // Store gateway specific payment details
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true
  }
);

/**
 * @typedef Payment
 */
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
