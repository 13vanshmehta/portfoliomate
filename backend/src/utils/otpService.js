const nodemailer = require('nodemailer');

// In-memory OTP storage (simple Map)
const otpStore = new Map();

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP in memory with expiry
 */
const storeOTP = async (email, otp) => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
  
  otpStore.set(email, {
    otp,
    expiryTime,
  });
  
  // Auto-cleanup after expiry
  setTimeout(() => {
    otpStore.delete(email);
  }, expiryMinutes * 60 * 1000);
};

/**
 * Verify OTP
 */
const verifyOTP = async (email, otp) => {
  const stored = otpStore.get(email);
  
  if (!stored) {
    return { valid: false, message: 'OTP expired or not found' };
  }
  
  // Check if expired
  if (Date.now() > stored.expiryTime) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP expired' };
  }
  
  // Check if OTP matches
  if (stored.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // Delete OTP after successful verification
  otpStore.delete(email);
  
  return { valid: true, message: 'OTP verified successfully' };
};

/**
 * Send OTP via email
 */
const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const subject = purpose === 'verification' 
      ? 'PortfolioMate - Email Verification OTP'
      : 'PortfolioMate - Password Reset OTP';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">PortfolioMate</h2>
        <p>Your OTP for ${purpose} is:</p>
        <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px; color: #333;">
          ${otp}
        </h1>
        <p>This OTP will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up expired OTPs (called periodically)
 */
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiryTime) {
      otpStore.delete(email);
    }
  }
};

// Cleanup expired OTPs every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
};
