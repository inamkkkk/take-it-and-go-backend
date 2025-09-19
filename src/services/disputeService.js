const { Dispute } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');

const createDispute = async (disputeBody) => {
  // TODO: Implement creation of a new dispute record
  // - Validate input, ensure tripId and userId exist
  // - Create new Dispute document
  // - Potentially notify admin or customer support system
  logger.info(`Creating new dispute for trip ${disputeBody.tripId} by user ${disputeBody.userId}`);
  const dispute = await Dispute.create(disputeBody);
  return dispute;
};

const getDisputeById = async (disputeId) => {
  // TODO: Implement retrieval of a single dispute by its ID
  logger.info(`Fetching dispute with ID: ${disputeId}`);
  const dispute = await Dispute.findById(disputeId).populate('userId').populate('tripId');
  return dispute;
};

const updateDisputeStatus = async (disputeId, status, resolutionDetails, resolvedBy) => {
  // TODO: Implement updating the status and resolution of a dispute
  // This would typically be an admin action
  logger.info(`Updating dispute ${disputeId} to status: ${status}`);
  const dispute = await Dispute.findByIdAndUpdate(disputeId, { status, resolutionDetails, resolvedBy, updatedAt: Date.now() }, { new: true });
  if (!dispute) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dispute not found');
  }
  return dispute;
};

module.exports = {
  createDispute,
  getDisputeById,
  updateDisputeStatus,
};
