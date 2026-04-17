const express = require('express');
const router = express.Router();
const firmController = require('../controllers/firmController');
const { authenticate } = require('../middleware/auth');
const {
  createFirmValidation,
  updateFirmValidation,
} = require('../middleware/validation');

// @route   POST /api/v1/firms
// @desc    Create new firm
// @access  Public (or can be made private based on requirements)
router.post('/', createFirmValidation, firmController.createFirm);

// @route   GET /api/v1/firms
// @desc    Get all firms
// @access  Public
router.get('/', firmController.getAllFirms);

// @route   GET /api/v1/firms/:firmId
// @desc    Get firm by ID
// @access  Public
router.get('/:firmId', firmController.getFirm);

// Protected routes
router.use(authenticate);

// @route   PUT /api/v1/firms/:firmId
// @desc    Update firm
// @access  Private
router.put('/:firmId', updateFirmValidation, firmController.updateFirm);

// @route   DELETE /api/v1/firms/:firmId
// @desc    Delete firm
// @access  Private
router.delete('/:firmId', firmController.deleteFirm);

module.exports = router;
