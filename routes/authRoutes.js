const express = require('express');
const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get Current User (Me)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user is populated by authMiddleware
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Verify Email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
});

// User Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    const user = new User({
      username,
      email,
      password,
      displayName: username
    });

    // Get verification token
    const verificationToken = user.getVerificationToken();
    await user.save();

    // Create verification url
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    // Create message
    const message = `
      <h1>Email Verification</h1>
      <p>Please verify your email address to log in to Offer Bazar.</p>
      <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - Offer Bazar',
        message
      });

      res.status(201).json({
        success: true,
        message: 'Account created. Please check your email to verify your account.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
    } catch (err) {
      console.error('Email send error:', err);
      user.verificationToken = undefined;
      user.verificationTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message
    });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email to log in.'
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;

    console.log('Google auth request:', { uid, email, displayName, photoURL });

    // Check if it's a merchant login (simplified logic for now)
    // You might want to pass a 'role' param from frontend to distinguish
    let merchant = await Merchant.findOne({ email });

    if (merchant) {
      const token = jwt.sign(
        { id: merchant._id, email: merchant.email, role: 'merchant' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Google authentication successful',
        token: token,
        user: {
          id: merchant._id,
          name: merchant.name,
          email: merchant.email,
          photoURL: merchant.photoURL,
          role: 'merchant'
        }
      });
    }

    // Default to User if not found as merchant, or create new User?
    // Current logic was creating Merchant only. Preserving existing behavior strictly for now 
    // but this route needs refactoring if User Google Login is needed.
    // For now, I will leave the original logic below to avoid breaking changes 
    // unless the User is asking for Google Login fix too.

    // REVERTing to original logic to be safe, but imported User above.
    // Wait, I should probably leave the Google logic as is for now or slightly improve it.
    // The previous code was:

    if (!merchant) {
      merchant = new Merchant({
        name: displayName,
        email: email,
        googleId: uid,
        photoURL: photoURL,
        isApproved: true,
        isActive: true
      });
      await merchant.save();
    }

    const token = jwt.sign(
      { id: merchant._id, email: merchant.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Google authentication successful',
      token: token,
      user: {
        id: merchant._id,
        name: merchant.name,
        email: merchant.email,
        photoURL: merchant.photoURL
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
});

module.exports = router;
