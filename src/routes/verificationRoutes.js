const express = require('express');
const validate = require('../middlewares/validator');
const { verificationController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');
// Assuming you'll use a file upload middleware like Multer
const multer = require('multer');
const path = require('path');

// TODO: Configure Multer to use cloud storage (e.g., S3) instead of local disk for production.
// For now, using a temporary local storage.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the 'uploads' directory exists
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

const router = express.Router();

// Validation schemas
// TODO: Refine schema to be more explicit about expected file types or other metadata if needed.
const uploadDocumentsSchema = {
  // File uploads are handled by Multer. The `validate` middleware will check `req.body` fields
  // after Multer has processed the files and populated `req.files`.
  body: Joi.object().keys({
    // These will be populated by the Multer middleware after file uploads.
    documentUrls: Joi.array().items(Joi.string().uri()).min(1).optional(), // URLs to uploaded ID documents (populated by middleware)
    selfieUrl: Joi.string().uri().optional(), // URL to uploaded selfie (populated by middleware)
    documentType: Joi.string().valid('national_id', 'passport', 'driving_license', 'utility_bill').optional(),
    // Add any other metadata fields required for verification
  }).xor('documentUrls', 'selfieUrl'), // At least one document URL or selfie URL should be provided if files are uploaded, or handled by specific requirements
};

const getStatusSchema = {
  params: Joi.object().keys({
    userId: Joi.string().required().hex().length(24), // ObjectId
  }),
};

// NOTE: The following route handles file uploads using Multer and then prepares
// the data for the controller. In a production environment, the `upload` middleware
// should be configured to upload directly to cloud storage and return cloud URLs.
// The `req.body.documentUrls` and `req.body.selfieUrl` would then be populated
// with these cloud URLs.
router.post('/upload', authenticate, authorize(['shipper', 'traveler']), upload.fields([{ name: 'documents', maxCount: 5 }, { name: 'selfie', maxCount: 1 }]),
  (req, res, next) => {
    // Process uploaded files and populate req.body with URLs.
    // TODO: Replace `/uploads/` with actual cloud storage URLs.
    const documentUrls = req.files.documents ? req.files.documents.map(file => `/uploads/${file.filename}`) : [];
    const selfieUrl = req.files.selfie ? `/uploads/${req.files.selfie[0].filename}` : undefined;

    req.body.documentUrls = documentUrls;
    req.body.selfieUrl = selfieUrl;

    // Ensure at least one document or selfie is uploaded if required by logic
    if (documentUrls.length === 0 && !selfieUrl) {
        return res.status(400).json({ message: 'At least one document or selfie must be uploaded.' });
    }

    // TODO: Implement logic to handle potential Multer errors (e.g., file size limits)
    // For now, assuming success if req.files is populated.

    next();
  },
  validate(uploadDocumentsSchema), verificationController.uploadDocuments);

router.get('/status/:userId', authenticate, authorize(['shipper', 'traveler', 'admin']), validate(getStatusSchema), verificationController.getStatus);

module.exports = router;