const httpStatus = require('http-status-codes');
const { disputeService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { body, param, validationResult } = require('express-validator'); // Import express-validator

const reportIssue = async (req, res) => {
  try {
    // TODO: Implement logic to report a new dispute.
    // Steps:
    // 1. Validate input (userId, tripId, type, description, optional evidence).
    // 2. Create a new dispute record in the database (Dispute model).
    // 3. Notify relevant parties (e.g., admin, involved users) about the new dispute.
    logger.info(`Report issue request: ${JSON.stringify(req.body)}`);

    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(httpStatus.BAD_REQUEST).json(errorResponse('Validation failed', errors.array()));
    }

    const { userId, tripId, type, description, evidence } = req.body;

    // 2. Create a new dispute record in the database (Dispute model).
    const dispute = await disputeService.createDispute({ userId, tripId, type, description, evidence });

    // 3. Notify relevant parties (e.g., admin, involved users) about the new dispute.
    // TODO: Implement notification logic here. For now, just log it.
    logger.info(`New dispute reported: ${dispute._id}. User: ${userId}, Trip: ${tripId}`);

    res.status(httpStatus.CREATED).json(successResponse('Dispute reported successfully', dispute));
  } catch (error) {
    logger.error(`Report issue error: ${error.message}`);
    // More specific error handling could be added here based on the type of error
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message || 'Failed to report dispute'));
  }
};

const getDispute = async (req, res) => {
  try {
    // TODO: Implement logic to retrieve a specific dispute by ID.
    // Steps:
    // 1. Validate dispute ID from params.
    // 2. Retrieve dispute record from the database (Dispute model).
    // 3. Ensure authorized user can view the dispute (e.g., involved user or admin).
    logger.info(`Get dispute request for ID: ${req.params.id}`);

    // 1. Validate dispute ID from params
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(httpStatus.BAD_REQUEST).json(errorResponse('Validation failed', errors.array()));
    }

    const disputeId = req.params.id;

    // 2. Retrieve dispute record from the database (Dispute model).
    const dispute = await disputeService.getDisputeById(disputeId);

    if (!dispute) {
      return res.status(httpStatus.NOT_FOUND).json(errorResponse('Dispute not found'));
    }

    // 3. Ensure authorized user can view the dispute (e.g., involved user or admin).
    // TODO: Implement authorization logic here. For now, assume any authenticated user can view.
    // Example: if (req.user.id !== dispute.userId && !req.user.isAdmin) { return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('Unauthorized to view dispute')); }
    logger.info(`Dispute ${disputeId} retrieved successfully.`);

    res.status(httpStatus.OK).json(successResponse('Dispute retrieved successfully', dispute));
  } catch (error) {
    logger.error(`Get dispute error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(error.message || 'Failed to retrieve dispute'));
  }
};

// Validation middleware for reportIssue
const validateReportIssue = [
  body('userId').isString().notEmpty().withMessage('User ID is required'),
  body('tripId').isString().notEmpty().withMessage('Trip ID is required'),
  body('type').isString().notEmpty().withMessage('Dispute type is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('evidence').optional().isString().withMessage('Evidence must be a string'),
];

// Validation middleware for getDispute
const validateGetDispute = [
  param('id').isMongoId().withMessage('Invalid dispute ID'), // Assuming MongoDB ObjectId
];

module.exports = {
  reportIssue: [...validateReportIssue, reportIssue],
  getDispute: [...validateGetDispute, getDispute],
};