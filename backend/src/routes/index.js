const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const announcementRoutes = require('./announcementRoutes');
const firmRoutes = require('./firmRoutes');
const notificationRoutes = require('./notificationRoutes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PortfolioMate API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/announcements', announcementRoutes);
router.use('/firms', firmRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
