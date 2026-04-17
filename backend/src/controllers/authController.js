const { auth } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail, updateUser } = require('../services/userService');
const { getFirmById } = require('../services/firmService');
const { generateOTP, storeOTP, verifyOTP, sendOTPEmail } = require('../utils/otpService');

const generateSessionToken = (user) => {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  return jwt.sign(
    {
      userId: user.userId,
      email: user.emailId,
      firmId: user.firmId,
    },
    secret,
    { expiresIn: '7d' }
  );
};

// Email/Password Signup
const signup = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    let { firmId } = req.body;
    firmId = String(firmId || '').trim();

    // Check if firm exists
    const firm = await getFirmById(firmId);
    if (!firm) {
      return res.status(404).json({
        success: false,
        message: 'Firm not found',
      });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create Firebase Auth user
    const userRecord = await auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Generate and send OTP
    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendOTPEmail(email, otp, 'verification');

    // Create user in Firestore
    const user = await createUser({
      userId: userRecord.uid,
      emailId: email,
      firstName,
      lastName,
      firmId,
      authProvider: 'email',
      isEmailVerified: false,
      profilePhotoUrl: null,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully. Please verify your email with the OTP sent.',
      data: {
        userId: user.userId,
        email: user.emailId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOTP(email, otp);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Update user verification status
    const user = await getUserByEmail(email);
    if (user) {
      await auth().updateUser(user.userId, { emailVerified: true });
      await updateUser(user.userId, { isEmailVerified: true });
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Email/Password Login
const login = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Get user from Firestore
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
      });
    }

    const token = generateSessionToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Google Sign-In
const googleSignIn = async (req, res, next) => {
  try {
    const { idToken, firmId } = req.body;

    // Verify Google ID token
    const decodedToken = await auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Check if user exists
    let user = await getUserByEmail(email);

    if (!user) {
      if (!firmId) {
        return res.status(400).json({
          success: false,
          code: 'FIRM_REQUIRED',
          message: 'Firm ID is required for first-time Google sign-in',
        });
      }

      const firm = await getFirmById(firmId);
      if (!firm) {
        return res.status(404).json({
          success: false,
          message: 'Firm not found',
        });
      }

      // Create new user
      const [firstName, ...lastNameParts] = (name || email.split('@')[0]).split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      user = await createUser({
        userId: uid,
        emailId: email,
        firstName,
        lastName,
        firmId,
        authProvider: 'google',
        isEmailVerified: true,
        profilePhotoUrl: picture || null,
      });

      return res.status(201).json({
        success: true,
        message: 'User created and logged in successfully',
        data: {
          user: user.toJSON(),
          token: generateSessionToken(user),
        },
      });
    }

    // User exists, return user data
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token: generateSessionToken(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendOTPEmail(email, otp, 'verification');

    res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifyOtp,
  login,
  googleSignIn,
  resendOtp,
};
