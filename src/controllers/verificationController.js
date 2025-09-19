const httpStatus = require('http-status-codes');
const { verificationService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');
// TODO: Import Multer for file uploads.
const multer = require('multer');
// TODO: Configure Multer for file storage (e.g., local or cloud).
// For demonstration, using local storage. In production, consider cloud storage.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });


const uploadDocuments = async (req, res) => {
  // TODO: Implement ID verification document upload logic
  // Steps:
  // 1. Integrate with a file upload middleware (e.g., Multer) to handle file storage (local or cloud).
  // 2. Validate uploaded documents (e.g., file type, size).
  // 3. Create a verification record for the user (e.g., in a Verification model) with 'pending' status, storing document paths.
  // 4. Trigger admin review process (e.g., notify admin).
  logger.info(`Upload documents request for user: ${req.user.id}`); // Assuming req.user is populated by auth middleware

  // Step 1 is handled by the middleware `upload.fields(...)` below.
  // Step 2: Multer can handle basic validation, but more complex validation might be needed.
  const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  if (req.files.idProof && req.files.idProof[0]) {
    const file = req.files.idProof[0];
    if (!allowedFileTypes.includes(file.mimetype)) {
      return res.status(httpStatus.UNSUPPORTED_MEDIA_TYPE).json(errorResponse('Invalid file type for ID proof. Only JPEG, PNG, and PDF are allowed.'));
    }
    if (file.size > maxFileSize) {
      return res.status(httpStatus.PAYLOAD_TOO_LARGE).json(errorResponse('ID proof file size exceeds the limit of 5MB.'));
    }
  } else {
    return res.status(httpStatus.BAD_REQUEST).json(errorResponse('ID proof is required.'));
  }

  if (req.files.selfie && req.files.selfie[0]) {
    const file = req.files.selfie[0];
    if (!allowedFileTypes.includes(file.mimetype)) {
      return res.status(httpStatus.UNSUPPORTED_MEDIA_TYPE).json(errorResponse('Invalid file type for selfie. Only JPEG and PNG are allowed.'));
    }
    if (file.size > maxFileSize) {
      return res.status(httpStatus.PAYLOAD_TOO_LARGE).json(errorResponse('Selfie file size exceeds the limit of 5MB.'));
    }
  } else {
    return res.status(httpStatus.BAD_REQUEST).json(errorResponse('Selfie is required.'));
  }

  const documentPaths = {
    idProof: req.files.idProof ? req.files.idProof[0].path : null,
    selfie: req.files.selfie ? req.files.selfie[0].path : null,
  };
  const userId = req.user.id; // Get userId from authenticated user

  try {
    // Step 3: Create a verification record
    const verification = await verificationService.submitVerificationDocuments(userId, documentPaths);
    // Step 4: Trigger admin review process (this would typically be handled by the service or a separate job)
    // For now, assume the service handles notifications or queuing.
    res.status(httpStatus.OK).json(successResponse('Documents uploaded for verification. Pending admin review.', verification));
  } catch (error) {
    logger.error(`Upload documents error for user ${userId}: ${error.message}`);
    // Clean up uploaded files if an error occurs during verification record creation
    if (documentPaths.idProof) await fs.promises.unlink(documentPaths.idProof).catch(e => logger.error(`Failed to delete temporary file: ${documentPaths.idProof}`, e));
    if (documentPaths.selfie) await fs.promises.unlink(documentPaths.selfie).catch(e => logger.error(`Failed to delete temporary file: ${documentPaths.selfie}`, e));
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message));
  }
};

// TODO: Import fs for file system operations if cleanup is needed
const fs = require('fs');

const getStatus = async (req, res) => {
  // TODO: Implement logic to get ID verification status for a user
  // Steps:
  // 1. Validate userId from params.
  // 2. Retrieve the latest verification record for the user from the database (Verification model).
  // 3. Return the status (pending, approved, rejected) and any relevant messages.
  const userId = req.params.userId;
  logger.info(`Get verification status request for user: ${userId}`);

  // Step 1: Validate userId from params. (Basic check, could be more robust)
  if (!userId) {
    return res.status(httpStatus.BAD_REQUEST).json(errorResponse('User ID is required.'));
  }

  try {
    // Step 2: Retrieve the latest verification record
    const status = await verificationService.getVerificationStatus(userId);

    // Step 3: Return the status
    if (!status) {
      return res.status(httpStatus.NOT_FOUND).json(errorResponse('Verification record not found for this user'));
    }
    res.status(httpStatus.OK).json(successResponse('Verification status retrieved', status));
  } catch (error) {
    logger.error(`Get verification status error for user ${userId}: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(`Failed to retrieve verification status: ${error.message}`));
  }
};

module.exports = {
  uploadDocuments: [
    // Apply Multer middleware to handle file uploads.
    // Expecting fields named 'idProof' and 'selfie'.
    upload.fields([{ name: 'idProof', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]),
    uploadDocuments
  ],
  getStatus,
};