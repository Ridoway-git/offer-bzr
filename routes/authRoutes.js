const express = require('express');
const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');
const router = express.Router();

router.post('/google', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    
    console.log('Google auth request:', { uid, email, displayName, photoURL });
    
    let merchant = await Merchant.findOne({ email });
    
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
