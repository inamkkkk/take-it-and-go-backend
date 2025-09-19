const mongoose = require('mongoose');
const { Schema } = mongoose;

const disputeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Delivery',
      required: [true, 'Trip ID is required'],
    },
    type: {
      type: String,
      enum: ['payment_issue', 'delivery_issue', 'item_damage', 'behavioral', 'other'],
      required: [true, 'Dispute type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
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
      // required: [true, 'Resolver ID is required when dispute is resolved'] // Uncomment if needed when status is 'resolved'
    },
    resolutionDetails: {
      type: String,
      trim: true,
      // required: [true, 'Resolution details are required when dispute is resolved'] // Uncomment if needed when status is 'resolved'
    },
    // createdAt and updatedAt are handled by { timestamps: true }
  },
  {
    timestamps: true,
  }
);

// TODO: Add a pre-save hook to validate resolvedBy and resolutionDetails when status is 'resolved'.
disputeSchema.pre('save', function(next) {
  if (this.status === 'resolved') {
    if (!this.resolvedBy) {
      return next(new Error('Resolver ID is required when dispute is resolved'));
    }
    if (!this.resolutionDetails) {
      return next(new Error('Resolution details are required when dispute is resolved'));
    }
  }
  next();
});


/**
 * @typedef Dispute
 */
const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;