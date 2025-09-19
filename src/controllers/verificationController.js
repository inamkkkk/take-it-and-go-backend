const httpStatus = require('http-status-codes');
const { verificationService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const uploadDocuments = async (req, res) => {
  // TODO: Implement ID verification document upload logic
  // Steps:
  // 1. Integrate with a file upload middleware (e.g., Multer) to handle file storage (local or cloud).
  // 2. Validate uploaded documents (e.g., file type, size).
  // 3. Create a verification record for the user (e.g., in a Verification model) with 'pending' status, storing document paths.
  // 4. Trigger admin review process (e.g., notify admin).
  logger.info(`Upload documents request for user: ${req.user.id}`); // Assuming req.user is populated by auth middleware

  // Placeholder for file processing
  const documentPaths = ["/path/to/id.jpg", "/path/to/selfie.jpg"]; // Example paths
  const userId = req.user.id; // Get userId from authenticated user

  try {
    const verification = await verificationService.submitVerificationDocuments(userId, documentPaths);
    res.status(httpStatus.OK).json(successResponse('Documents uploaded for verification', verification));
  } catch (error) {
    logger.error(`Upload documents error: ${error.message}`);
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message));
  }
};

const getStatus = async (req, res) => {
  // TODO: Implement logic to get ID verification status for a user
  // Steps:
  // 1. Validate userId from params.
  // 2. Retrieve the latest verification record for the user from the database (Verification model).
  // 3. Return the status (pending, approved, rejected) and any relevant messages.
  logger.info(`Get verification status request for user: ${req.params.userId}`);
  try {
    const status = await verificationService.getVerificationStatus(req.params.userId);
    if (!status) {
      return res.status(httpStatus.NOT_FOUND).json(errorResponse('Verification record not found for this user'));
    }
    res.status(httpStatus.OK).json(successResponse('Verification status retrieved', status));
  } catch (error) {
    logger.error(`Get verification status error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(error.message));
  }
};

module.exports = {
  uploadDocuments,
  getStatus,
};
