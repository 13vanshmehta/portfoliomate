const { auth } = require('../config/firebase');
const { getUserById, updateUser, deleteUser, getUserByEmail } = require('../services/userService');
const { generateOTP, storeOTP, verifyOTP, sendOTPEmail } = require('../utils/otpService');
const uploadService = require('../utils/uploadService');

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.uid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile (only for email/password users)
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await getUserById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.authProvider === 'google') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update profile for Google sign-in users',
      });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    const updatedUser = await updateUser(req.user.uid, updateData);

    // Update Firebase Auth display name
    if (firstName || lastName) {
      await auth().updateUser(req.user.uid, {
        displayName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Upload profile photo (only for email/password users)
const uploadProfilePhoto = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.authProvider === 'google') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update profile photo for Google sign-in users',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Upload to Firebase Storage
    const uploadResult = await uploadService.uploadFile(req.file, 'profile-photos');

    // Update user profile
    const updatedUser = await updateUser(req.user.uid, {
      profilePhotoUrl: uploadResult.url,
    });

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profilePhotoUrl: uploadResult.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete profile photo
const deleteProfilePhoto = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.authProvider === 'google') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete profile photo for Google sign-in users',
      });
    }

    await updateUser(req.user.uid, { profilePhotoUrl: null });

    res.json({
      success: true,
      message: 'Profile photo deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Request email change (send OTP to new email)
const requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    const user = await getUserById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.authProvider === 'google') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change email for Google sign-in users',
      });
    }

    // Check if new email already exists
    const existingUser = await getUserByEmail(newEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }

    // Generate and send OTP
    const otp = generateOTP();
    await storeOTP(newEmail, otp);
    await sendOTPEmail(newEmail, otp, 'email change verification');

    res.json({
      success: true,
      message: 'OTP sent to new email address',
    });
  } catch (error) {
    next(error);
  }
};

// Verify and update email
const updateEmail = async (req, res, next) => {
  try {
    const { newEmail, otp } = req.body;

    const result = await verifyOTP(newEmail, otp);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Update Firebase Auth email
    await auth().updateUser(req.user.uid, { email: newEmail });

    // Update Firestore
    const updatedUser = await updateUser(req.user.uid, { emailId: newEmail });

    res.json({
      success: true,
      message: 'Email updated successfully',
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Update password (with current password)
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await getUserById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.authProvider === 'google') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change password for Google sign-in users',
      });
    }

    // Note: Current password verification should be done on client side with Firebase Auth
    // Update password in Firebase Auth
    await auth().updateUser(req.user.uid, { password: newPassword });

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password (send OTP)
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'Google sign-in users cannot reset password',
      });
    }

    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendOTPEmail(email, otp, 'password reset');

    res.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

// Reset password with OTP
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await verifyOTP(email, otp);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update password in Firebase Auth
    await auth().updateUser(user.userId, { password: newPassword });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete user account
const deleteAccount = async (req, res, next) => {
  try {
    // Delete from Firebase Auth
    await auth().deleteUser(req.user.uid);

    // Delete from Firestore
    await deleteUser(req.user.uid);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  requestEmailChange,
  updateEmail,
  updatePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
};
