const { auth } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const { getUserById } = require('../services/userService');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided',
      });
    }

    const token = authHeader.split('Bearer ')[1];

    let userId = null;
    let email = null;

    try {
      // First try Firebase ID tokens
      const decodedToken = await auth().verifyIdToken(token);
      userId = decodedToken.uid;
      email = decodedToken.email;
    } catch (_firebaseError) {
      // Fallback to backend JWT session token
      const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
      const decodedJwt = jwt.verify(token, secret);
      userId = decodedJwt.userId;
      email = decodedJwt.email;
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    // Attach user info to request
    req.user = {
      uid: userId,
      email,
      firmId: user.firmId,
      ...user,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token',
      error: error.message,
    });
  }
};

const checkFirmAccess = (req, res, next) => {
  try {
    const { firmId } = req.params;
    
    if (req.user.firmId !== firmId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this firm',
      });
    }

    next();
  } catch (error) {
    console.error('Firm access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking firm access',
      error: error.message,
    });
  }
};

module.exports = {
  authenticate,
  checkFirmAccess,
};
