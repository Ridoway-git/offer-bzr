const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const merchant = await Merchant.findById(decoded.id);
    
    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = { id: merchant._id.toString(), email: merchant.email };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = authMiddleware;
