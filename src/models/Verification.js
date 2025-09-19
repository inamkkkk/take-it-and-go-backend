const mongoose = require('mongoose');
const { Schema } = mongoose;

const verificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Only one active verification process per user at a time
    },
    documentType: {
      type: String,
      enum: ['national_id', 'passport', 'driving_license', 'utility_bill'],
      required: false, // Could be inferred from filename or set by user
    },
    documentUrls: {
      type: [String], // URLs to uploaded documents (e.g., S3 URLs)
      required: true,
    },
    selfieUrl: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'verified', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Admin user who reviewed
    },
  },
  {
    timestamps: true,
  }
);

// TODO: Add a virtual field to get the User associated with this verification
verificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// TODO: Add a pre-save hook to automatically set `reviewedAt` when status changes to 'verified' or 'rejected'
verificationSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'verified' || this.status === 'rejected')) {
    this.reviewedAt = new Date();
  }
  next();
});

/**
 * @typedef Verification
 */
const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;