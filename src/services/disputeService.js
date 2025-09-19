const { Dispute } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');

const createDispute = async (disputeBody) => {
  // TODO: Implement creation of a new dispute record
  // - Validate input, ensure tripId and userId exist
  // - Create new Dispute document
  // - Potentially notify admin or customer support system

  // Validate input
  const schema = Joi.object({
    tripId: Joi.string().required(),
    userId: Joi.string().required(),
    reason: Joi.string().required(),
    details: Joi.string().allow('').optional(),
  });

  const { error, value } = schema.validate(disputeBody);
  if (error) {
    logger.error(`Dispute validation error: ${error.details[0].message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid dispute data: ${error.details[0].message}`);
  }

  logger.info(`Creating new dispute for trip ${value.tripId} by user ${value.userId}`);

  const existingDispute = await Dispute.findOne({ tripId: value.tripId, userId: value.userId });
  if (existingDispute) {
    throw new ApiError(httpStatus.CONFLICT, 'A dispute for this trip and user already exists.');
  }

  const dispute = await Dispute.create(value);

  // TODO: Potentially notify admin or customer support system
  // For now, we'll just log that this would happen.
  logger.info(`Dispute created successfully: ${dispute._id}. Notification process would start here.`);

  return dispute;
};

const getDisputeById = async (disputeId) => {
  // TODO: Implement retrieval of a single dispute by its ID
  logger.info(`Fetching dispute with ID: ${disputeId}`);

  if (!disputeId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Dispute ID is required');
  }

  const dispute = await Dispute.findById(disputeId).populate('userId').populate('tripId');
  if (!dispute) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dispute not found');
  }
  return dispute;
};

const updateDisputeStatus = async (disputeId, status, resolutionDetails, resolvedBy) => {
  // TODO: Implement updating the status and resolution of a dispute
  // This would typically be an admin action
  logger.info(`Updating dispute ${disputeId} to status: ${status}`);

  if (!disputeId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Dispute ID is required');
  }

  // Basic status validation
  const validStatuses = ['open', 'in_progress', 'resolved', 'rejected']; // Example statuses
  if (!validStatuses.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid dispute status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
  }

  const updateData = {
    status,
    updatedAt: Date.now(),
  };

  if (resolutionDetails !== undefined) {
    updateData.resolutionDetails = resolutionDetails;
  }
  if (resolvedBy !== undefined) {
    updateData.resolvedBy = resolvedBy;
  }

  const dispute = await Dispute.findByIdAndUpdate(disputeId, updateData, { new: true });
  if (!dispute) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dispute not found');
  }

  // TODO: Potentially trigger notifications about dispute resolution
  logger.info(`Dispute ${disputeId} updated. Notification process for user/admin would start here.`);

  return dispute;
};

module.exports = {
  createDispute,
  getDisputeById,
  updateDisputeStatus,
};