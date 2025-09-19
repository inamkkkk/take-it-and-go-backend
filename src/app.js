const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const config = require('./config');
const morgan = require('./middlewares/morgan');
const { errorHandler } = require('./middlewares/errorHandler');
const { notFound } = require('./middlewares/notFound');
const rateLimit = require('express-rate-limit'); // Added for rate limiting

// Import all routes
const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
// TODO: Configure CORS more specifically if needed, e.g., allow only specific origins
app.use(cors());
app.options('*', cors()); // Pre-flight requests for all origins

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Sanitize request data to prevent XSS attacks
app.use(xss());

// TODO: Implement rate limiting to protect against brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);


// Request logging
app.use(morgan.successHandler);
app.use(morgan.errorHandler);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: `Welcome to Take iT & Go Backend API v${config.apiVersion}` });
});

// Handle 404 errors (requests that don't match any routes)
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;