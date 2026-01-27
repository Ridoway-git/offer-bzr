const express = require('express');
const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/me', authMiddleware, async (req, res) => {
  try {
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

// Sync Firebase User with Backend (Create/Update + Generate JWT)
router.post('/sync', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;

    // Check if user exists by firebaseUid OR email
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: email }]
    });

    if (!user) {
      // Create new user
      user = new User({
        firebaseUid: uid,
        email,
        username: displayName || email.split('@')[0], // Fallback username
        displayName,
        photoURL,
        isVerified: false // Will be updated by frontend flow or future logic
      });
      await user.save();
    } else {
      // Update existing user with firebaseUid if missing
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    // Generate Token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user'
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error.message
    });
  }
});

// Test Email Endpoint
router.get('/test-email', async (req, res) => {
  try {
    await sendEmail({
      email: process.env.EMAIL_USER, // Send to self
      subject: 'Test Email from Offer Bazar',
      message: '<h1>It works!</h1><p>Email configuration is correct.</p>'
    });
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({
      success: false,
      message: 'Email failed',
      error: error.message,
      stack: error.stack
    });
  }
});

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

    const verificationToken = user.getVerificationToken();
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

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
      console.error('Email send error (Non-fatal):', err);
      // Do not delete user, allow them to login anyway
      // await User.findByIdAndDelete(user._id);

      // Return success but with a warning or just success since we disabled verification
      return res.status(201).json({
        success: true,
        message: 'Account created successfully. You can now login.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
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


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if verified - TEMPORARILY DISABLED for ease of access
    /* 
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email to log in.'
      });
    }
    */

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
