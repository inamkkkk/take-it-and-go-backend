const { Verification, User } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');

const submitVerificationDocuments = async (userId, documentUrls, selfieUrl, documentType) => {
  // TODO: Implement logic to save verification documents and initiate review
  // Steps:
  // 1. Check if an existing 'pending' or 'in_review' verification record exists for the user.
  // 2. If so, update it. Otherwise, create a new one.
  // 3. Store documentUrls and selfieUrl.
  // 4. Update User.isIdVerified status to 'pending'.
  // 5. Trigger notification to admin for review.

  logger.info(`Submitting verification documents for user ${userId}`);

  const existingVerification = await Verification.findOneAndUpdate(
    { userId },
    {
      documentUrls,
      selfieUrl,
      documentType,
      status: 'pending',
      submittedAt: Date.now(),
      rejectionReason: null, // Clear previous rejection reason if resubmitting
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findByIdAndUpdate(userId, { isIdVerified: 'pending' });

  // TODO: Notify admin for review
  logger.warn(`Admin notification for new verification submission for user ${userId} is stubbed.`);

  return existingVerification;
};

const getVerificationStatus = async (userId) => {
  // TODO: Implement logic to retrieve the current verification status for a user
  logger.info(`Fetching verification status for user ${userId}`);
  const verification = await Verification.findOne({ userId });
  return verification;
};

const updateVerificationStatus = async (verificationId, newStatus, rejectionReason, reviewedByAdminId) => {
  // TODO: Implement updating verification status (admin action)
  // Steps:
  // 1. Find the verification record.
  // 2. Update status (verified/rejected).
  // 3. Update associated User.isIdVerified status.
  // 4. Store rejectionReason if applicable.
  // 5. Notify the user about the verification outcome.

  logger.info(`Updating verification ${verificationId} to status: ${newStatus}`);
  const verification = await Verification.findById(verificationId);
  if (!verification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Verification record not found');
  }

  verification.status = newStatus;
  verification.reviewedAt = Date.now();
  verification.reviewedBy = reviewedByAdminId;
  if (newStatus === 'rejected') {
    verification.rejectionReason = rejectionReason;
  }
  await verification.save();

  await User.findByIdAndUpdate(verification.userId, { isIdVerified: newStatus });

  // TODO: Notify user about verification outcome
  logger.warn(`User notification about verification outcome for user ${verification.userId} is stubbed.`);

  return verification;
};

module.exports = {
  submitVerificationDocuments,
  getVerificationStatus,
  updateVerificationStatus,
};
