const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB URL'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    RAZORPAY_KEY_ID: Joi.string().description('Razorpay Key ID for payments'),
    RAZORPAY_KEY_SECRET: Joi.string().description('Razorpay Key Secret for payments'),
    STRIPE_SECRET_KEY: Joi.string().description('Stripe Secret Key for payments'),
    GOOGLE_MAPS_API_KEY: Joi.string().description('Google Maps API Key'),
    FCM_SERVER_KEY: Joi.string().description('Firebase Cloud Messaging Server Key'),
    REDIS_URL: Joi.string().description('Redis URL for caching and sessions'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  },
  integrations: {
    razorpay: {
      keyId: envVars.RAZORPAY_KEY_ID,
      keySecret: envVars.RAZORPAY_KEY_SECRET,
    },
    stripe: {
      secretKey: envVars.STRIPE_SECRET_KEY,
    },
    googleMaps: {
      apiKey: envVars.GOOGLE_MAPS_API_KEY,
    },
    fcm: {
      serverKey: envVars.FCM_SERVER_KEY,
    },
    redis: {
      url: envVars.REDIS_URL,
    },
  },
  apiVersion: '1.0.0',
};
