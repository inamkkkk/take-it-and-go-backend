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
      index: true, // Add index for faster queries on transactionId
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
    // TODO: Add a field to track if the payment is confirmed by both parties
    // This could be a boolean or an enum to represent different confirmation states
    confirmation: {
      type: String,
      enum: ['pending_shipper', 'pending_traveler', 'confirmed', 'disputed'],
      default: 'pending_shipper', // Initially, shipper needs to confirm before traveler
    },
    // TODO: Add a field for payment method, e.g., 'credit_card', 'bank_transfer', 'crypto'
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'crypto', 'other'],
      required: false,
    },
    // TODO: Add a field for payment method details, like last 4 digits of card, expiry date, etc.
    // This should be encrypted or handled securely depending on the sensitivity.
    paymentMethodDetails: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true // This will automatically add createdAt and updatedAt fields
  }
);

// TODO: Add pre-save hook to update 'updatedAt' if not handled by timestamps
// The 'timestamps: true' option in the schema options already handles this.
// No additional hook is needed for basic timestamp updates.

// TODO: Add instance methods for common payment operations like 'confirmPayment', 'disputePayment', 'refundPayment'

/**
 * Confirms the payment.
 * @returns {Promise<Payment>} The updated payment document.
 */
paymentSchema.methods.confirmPayment = async function() {
  this.status = 'completed';
  // TODO: Implement logic to release funds or trigger next steps upon confirmation
  // For now, just updating status.
  await this.save();
  return this;
};

/**
 * Disputes a payment.
 * @param {string} reason - The reason for the dispute.
 * @returns {Promise<Payment>} The updated payment document.
 */
paymentSchema.methods.disputePayment = async function(reason) {
  this.status = 'disputed';
  // TODO: Add a field to store the dispute reason if it's not already in paymentDetails
  // For now, assuming paymentDetails can be extended or a new field is added.
  this.paymentDetails.disputeReason = reason;
  await this.save();
  return this;
};

/**
 * Refunds a payment.
 * @param {number} refundAmount - The amount to refund.
 * @param {string} reason - The reason for the refund.
 * @returns {Promise<Payment>} The updated payment document.
 */
paymentSchema.methods.refundPayment = async function(refundAmount, reason) {
  if (refundAmount > this.amount) {
    throw new Error("Refund amount cannot exceed the original payment amount.");
  }
  this.status = 'refunded';
  // TODO: Implement logic for actual refund processing via the payment gateway
  this.paymentDetails.refundAmount = refundAmount;
  this.paymentDetails.refundReason = reason;
  await this.save();
  return this;
};


/**
 * @typedef Payment
 */
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;