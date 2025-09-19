const express = require('express');
const validate = require('../middlewares/validator');
const { authController } = require('../controllers');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const signupSchema = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    phone: Joi.string().required().pattern(/^\+[1-9]\d{1,14}$/), // E.164 format
    password: Joi.string().required().min(8).regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/).messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one letter and one number',
    }),
    role: Joi.string().valid('shipper', 'traveler').default('shipper'),
  }),
};

const loginSchema = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const forgotPasswordSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPasswordSchema = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    newPassword: Joi.string().required().min(8).regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/).messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one letter and one number',
    }),
  }),
};

// TODO: Implement logout route
// TODO: Implement refresh token route
// TODO: Implement email verification route

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;