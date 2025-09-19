const mongoose = require('mongoose');
const { Schema } = mongoose;

const disputeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true,
    },
    type: {
      type: String,
      enum: ['payment_issue', 'delivery_issue', 'item_damage', 'behavioral', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    evidence: {
      type: [String], // Array of URLs to uploaded evidence (images, documents)
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'escalated', 'closed'],
      default: 'open',
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Admin user who resolved the dispute
    },
    resolutionDetails: {
      type: String,
      trim: true,
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
    timestamps: true,
  }
);

/**
 * @typedef Dispute
 */
const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;
