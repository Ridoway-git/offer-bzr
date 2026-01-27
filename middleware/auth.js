const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');
const User = require('../models/User');

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

    let user = null;
    let role = decoded.role;

    if (role === 'merchant') {
      user = await Merchant.findById(decoded.id);
    } else if (role === 'user') {
      user = await User.findById(decoded.id);
    } else {
      // Fallback for old tokens or unspecified roles: try both
      user = await Merchant.findById(decoded.id);
      if (user) {
        role = 'merchant';
      } else {
        user = await User.findById(decoded.id);
        if (user) role = 'user';
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - User not found'
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: role || 'user',
      name: user.displayName || user.name
    };
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
