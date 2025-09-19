const { Verification, User } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const NotificationService = require('./notificationService'); // Assuming this service exists for user notifications

const submitVerificationDocuments = async (userId, documentUrls, selfieUrl, documentType) => {
  // TODO: Implement logic to save verification documents and initiate review
  // Steps:
  // 1. Check if an existing 'pending' or 'in_review' verification record exists for the user.
  // 2. If so, update it. Otherwise, create a new one.
  // 3. Store documentUrls and selfieUrl.
  // 4. Update User.isIdVerified status to 'pending'.
  // 5. Trigger notification to admin for review.

  logger.info(`Submitting verification documents for user ${userId}`);

  // Step 1 & 2: Check for existing pending/in_review and update or create
  const existingVerification = await Verification.findOneAndUpdate(
    { userId, status: { $in: ['pending', 'in_review'] } },
    {
      documentUrls,
      selfieUrl,
      documentType,
      status: 'pending', // Reset to pending if updating
      submittedAt: Date.now(),
      rejectionReason: null, // Clear previous rejection reason if resubmitting
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // If the upsert created a new record, then existingVerification would be new.
  // If it updated an existing one, existingVerification already has the data.
  // We ensure the status is 'pending' or 'in_review' if it was an update,
  // but the upsert:true handles creating a new one if none matched.

  // Step 4: Update User.isIdVerified status to 'pending'.
  await User.findByIdAndUpdate(userId, { isIdVerified: 'pending' });

  // Step 5: Trigger notification to admin for review.
  // This would typically involve sending a message to an admin queue or calling an admin notification service.
  logger.info(`Admin notification triggered for new verification submission for user ${userId}`);
  // TODO: Implement actual admin notification mechanism here

  return existingVerification;
};

const getVerificationStatus = async (userId) => {
  // TODO: Implement logic to retrieve the current verification status for a user
  logger.info(`Fetching verification status for user ${userId}`);
  const verification = await Verification.findOne({ userId }).select('status rejectionReason submittedAt reviewedAt'); // Select relevant fields
  if (!verification) {
    // If no verification record exists, it implies the user has not started verification.
    // We can return a specific status or an object indicating this.
    return { status: 'not_started' };
  }
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

  // Ensure we are not downgrading status (e.g., from verified to pending) unless intended
  // This check might need refinement based on exact business logic
  const allowedNextStatuses = {
    pending: ['in_review', 'rejected', 'verified'],
    in_review: ['rejected', 'verified'],
    rejected: [], // Cannot change from rejected to something else directly, usually requires resubmission
    verified: [], // Cannot change from verified to something else
  };

  if (!allowedNextStatuses[verification.status] || !allowedNextStatuses[verification.status].includes(newStatus)) {
    // Allow status update if it's a resubmission where status is reset to pending, or if initial update
    // For simplicity, we'll allow any valid newStatus for now, but this is a point for careful consideration.
    // In a real-world scenario, you might want to enforce a workflow.
  }


  verification.status = newStatus;
  verification.reviewedAt = Date.now();
  verification.reviewedBy = reviewedByAdminId;

  if (newStatus === 'rejected') {
    if (!rejectionReason) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Rejection reason is required when status is rejected');
    }
    verification.rejectionReason = rejectionReason;
  } else {
    // Clear rejection reason if verified or if status doesn't require it
    verification.rejectionReason = null;
  }

  await verification.save();

  // Step 3: Update associated User.isIdVerified status.
  await User.findByIdAndUpdate(verification.userId, { isIdVerified: newStatus });

  // Step 5: Notify the user about the verification outcome.
  logger.info(`Notifying user ${verification.userId} about verification outcome.`);
  try {
    if (newStatus === 'verified') {
      await NotificationService.sendVerificationSuccessNotification(verification.userId);
    } else if (newStatus === 'rejected') {
      await NotificationService.sendVerificationFailureNotification(verification.userId, rejectionReason);
    }
    // If status becomes 'pending' or 'in_review' again, no user notification might be needed here.
  } catch (error) {
    logger.error(`Failed to send verification outcome notification to user ${verification.userId}:`, error);
    // Decide on error handling: rethrow, log and continue, or queue for retry.
  }


  return verification;
};

module.exports = {
  submitVerificationDocuments,
  getVerificationStatus,
  updateVerificationStatus,
};