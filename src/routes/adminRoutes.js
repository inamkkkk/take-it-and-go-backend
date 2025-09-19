const express = require('express');
const validate = require('../middlewares/validator');
const { adminController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const adminLoginSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

// TODO: Implement rate limiting for the login route to prevent brute-force attacks.
// For now, we will add the login route.
router.post('/login', validate(adminLoginSchema), adminController.login);

// TODO: Add routes for managing users (view, create, update, delete).
// TODO: Add routes for managing products (view, create, update, delete).
// TODO: Add routes for managing orders (view, update status).
// TODO: Add routes for viewing dashboards and analytics.
// TODO: Implement routes for managing categories.

router.get('/verifications', authenticate, authorize(['admin']), adminController.listVerifications);
router.get('/disputes', authenticate, authorize(['admin']), adminController.listDisputes);
router.get('/deliveries', authenticate, authorize(['admin']), adminController.listDeliveries);
router.get('/payments', authenticate, authorize(['admin']), adminController.paymentsOverview);

module.exports = router;