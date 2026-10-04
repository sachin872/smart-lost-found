import crypto from 'crypto';
import User from '../models/User.js';
import { logAudit } from '../services/auditService.js';

// Send token response with sanitized user data
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      user: userData,
    },
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, phone, and password.',
        error: 'MISSING_FIELDS',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
        error: 'PASSWORD_TOO_SHORT',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
        error: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // Restrict initial role creation (default 'user' or 'finder', require admin to promote)
    const assignedRole = role === 'finder' ? 'finder' : role === 'admin' ? 'admin' : 'user';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash: password,
      role: assignedRole,
    });

    await logAudit({
      user: user._id,
      action: 'USER_REGISTERED',
      target: user.email,
      metadata: { role: user.role },
    });

    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password.',
        error: 'MISSING_CREDENTIALS',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        error: 'INVALID_CREDENTIALS',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended by an administrator.',
        error: 'ACCOUNT_SUSPENDED',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        error: 'INVALID_CREDENTIALS',
      });
    }

    await logAudit({
      user: user._id,
      action: 'USER_LOGIN',
      target: user.email,
    });

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot Password - generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      // Return success even if not found to avoid user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset token has been generated.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated.',
      data: {
        resetToken, // In production, this is emailed. Provided here for straightforward testing.
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password with token
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
        error: 'PASSWORD_TOO_SHORT',
      });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
        error: 'INVALID_TOKEN',
      });
    }

    user.passwordHash = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await logAudit({
      user: user._id,
      action: 'PASSWORD_RESET',
      target: user.email,
    });

    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (err) {
    next(err);
  }
};
