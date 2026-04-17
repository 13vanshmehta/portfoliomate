require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const { initializeFirebase } = require('./config/firebase');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');

// Initialize Express app
const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(apiLimiter);

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(apiPrefix, routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to PortfolioMate Announcement API',
    version: '1.0.0',
    documentation: `${apiPrefix}/health`,
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize services and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize Firebase
    initializeFirebase();
    // console.log('Firebase initialized successfully');

    // Start server
    app.listen(PORT, () => {
      console.log('-'.repeat(50));
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Base URL: http://localhost:${PORT}${apiPrefix}`);
      console.log(`Health Check: http://localhost:${PORT}${apiPrefix}/health`);
      console.log('-'.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
