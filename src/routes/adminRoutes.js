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

router.post('/login', validate(adminLoginSchema), adminController.login);
router.get('/verifications', authenticate, authorize(['admin']), adminController.listVerifications);
router.get('/disputes', authenticate, authorize(['admin']), adminController.listDisputes);
router.get('/deliveries', authenticate, authorize(['admin']), adminController.listDeliveries);
router.get('/payments', authenticate, authorize(['admin']), adminController.paymentsOverview);

module.exports = router;
