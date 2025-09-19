const express = require('express');
const validate = require('../middlewares/validator');
const { verificationController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');
// Assuming you'll use a file upload middleware like Multer
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temporary storage, should integrate with cloud storage for production

const router = express.Router();

// Validation schemas
const uploadDocumentsSchema = {
  // File uploads are typically handled by Multer first, then path/URL validated
  // For simplicity, this schema validates the *result* of an upload, e.g., document URLs
  body: Joi.object().keys({
    documentUrls: Joi.array().items(Joi.string().uri()).min(1).required(), // Array of URLs to uploaded ID documents
    selfieUrl: Joi.string().uri().optional(), // URL to uploaded selfie
    documentType: Joi.string().valid('national_id', 'passport', 'driving_license', 'utility_bill').optional(),
  }),
};

const getStatusSchema = {
  params: Joi.object().keys({
    userId: Joi.string().required().hex().length(24), // ObjectId
  }),
};

// NOTE: For production, Multer should upload to cloud storage (e.g., S3) and then return URLs.
// The current setup `upload.array('documents', 5)` is for basic local file handling.
// The `validate` middleware should then validate the *returned URLs* or `req.body` fields.
router.post('/upload', authenticate, authorize(['shipper', 'traveler']), upload.array('documents', 5), 
  // In a real scenario, you'd process req.files here to get URLs before passing to controller/service
  (req, res, next) => {
    // For demonstration, mock documentUrls based on uploaded files
    if (req.files && req.files.length > 0) {
      req.body.documentUrls = req.files.map(file => `/uploads/${file.filename}`); // Replace with actual cloud URLs
    } else if (!req.body.documentUrls) {
      req.body.documentUrls = []; // Ensure it's an array if no files and not provided in body
    }
    next();
  },
  validate(uploadDocumentsSchema), verificationController.uploadDocuments);

router.get('/status/:userId', authenticate, authorize(['shipper', 'traveler', 'admin']), validate(getStatusSchema), verificationController.getStatus);

module.exports = router;
