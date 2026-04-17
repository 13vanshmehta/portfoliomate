const firmService = require('../services/firmService');

// Create firm
const createFirm = async (req, res, next) => {
  try {
    const { firmName, firmEmailId, description } = req.body;

    // Check if firm email already exists
    const existingFirm = await firmService.getFirmByEmail(firmEmailId);
    if (existingFirm) {
      return res.status(400).json({
        success: false,
        message: 'Firm with this email already exists',
      });
    }

    const firm = await firmService.createFirm({
      firmName,
      firmEmailId,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Firm created successfully',
      data: firm.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Get all firms
const getAllFirms = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const firms = await firmService.getAllFirms(limit);

    res.json({
      success: true,
      data: firms.map(f => f.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

// Get firm by ID
const getFirm = async (req, res, next) => {
  try {
    const { firmId } = req.params;

    const firm = await firmService.getFirmById(firmId);

    if (!firm) {
      return res.status(404).json({
        success: false,
        message: 'Firm not found',
      });
    }

    res.json({
      success: true,
      data: firm.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Update firm
const updateFirm = async (req, res, next) => {
  try {
    const { firmId } = req.params;
    const { firmName, firmEmailId, description } = req.body;

    const firm = await firmService.getFirmById(firmId);

    if (!firm) {
      return res.status(404).json({
        success: false,
        message: 'Firm not found',
      });
    }

    const updateData = {};
    if (firmName) updateData.firmName = firmName;
    if (firmEmailId) {
      // Check if new email already exists
      const existingFirm = await firmService.getFirmByEmail(firmEmailId);
      if (existingFirm && existingFirm.firmId !== firmId) {
        return res.status(400).json({
          success: false,
          message: 'Firm with this email already exists',
        });
      }
      updateData.firmEmailId = firmEmailId;
    }
    if (description) updateData.description = description;

    const updatedFirm = await firmService.updateFirm(firmId, updateData);

    res.json({
      success: true,
      message: 'Firm updated successfully',
      data: updatedFirm.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Delete firm
const deleteFirm = async (req, res, next) => {
  try {
    const { firmId } = req.params;

    const firm = await firmService.getFirmById(firmId);

    if (!firm) {
      return res.status(404).json({
        success: false,
        message: 'Firm not found',
      });
    }

    // Check if there are users associated with this firm
    const { getUsersByFirm } = require('../services/userService');
    const users = await getUsersByFirm(firmId, 1);

    if (users.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete firm with associated users',
      });
    }

    await firmService.deleteFirm(firmId);

    res.json({
      success: true,
      message: 'Firm deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFirm,
  getAllFirms,
  getFirm,
  updateFirm,
  deleteFirm,
};
