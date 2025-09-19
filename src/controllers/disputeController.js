const httpStatus = require('http-status-codes');
const { disputeService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const reportIssue = async (req, res) => {
  try {
    // TODO: Implement logic to report a new dispute.
    // Steps:
    // 1. Validate input (userId, tripId, type, description, optional evidence).
    // 2. Create a new dispute record in the database (Dispute model).
    // 3. Notify relevant parties (e.g., admin, involved users) about the new dispute.
    logger.info(`Report issue request: ${JSON.stringify(req.body)}`);
    const dispute = await disputeService.createDispute(req.body);
    res.status(httpStatus.CREATED).json(successResponse('Dispute reported successfully', dispute));
  } catch (error) {
    logger.error(`Report issue error: ${error.message}`);
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message));
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
    const dispute = await disputeService.getDisputeById(req.params.id);
    if (!dispute) {
      return res.status(httpStatus.NOT_FOUND).json(errorResponse('Dispute not found'));
    }
    res.status(httpStatus.OK).json(successResponse('Dispute retrieved successfully', dispute));
  } catch (error) {
    logger.error(`Get dispute error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(error.message));
  }
};

module.exports = {
  reportIssue,
  getDispute,
};
