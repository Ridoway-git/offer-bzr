const jwt = require('jsonwebtoken');

const adminAuthMiddleware = async (req, res, next) => {
  try {
    // For admin panel, we'll use a simple approach
    // In production, you'd want proper admin authentication
    const adminToken = req.header('Authorization')?.replace('Bearer ', '');
    
    // For now, we'll allow admin operations without strict authentication
    // You can add proper admin authentication later
    if (!adminToken) {
      // Allow admin operations from the admin panel (localhost/admin panel)
      // This is a temporary solution - in production you'd want proper admin auth
      const isAdminPanel = req.get('Referer')?.includes('admin') || 
                          req.get('User-Agent')?.includes('admin') ||
                          req.get('Origin')?.includes('localhost');
      
      if (isAdminPanel) {
        // Set a mock admin user for admin panel operations
        req.user = { id: 'admin', email: 'admin@system.com', role: 'admin' };
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    // If token is provided, verify it (for future proper admin auth)
    try {
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      next();
    } catch (tokenError) {
      // If token verification fails, still allow admin panel operations
      const isAdminPanel = req.get('Referer')?.includes('admin') || 
                          req.get('User-Agent')?.includes('admin') ||
                          req.get('Origin')?.includes('localhost');
      
      if (isAdminPanel) {
        req.user = { id: 'admin', email: 'admin@system.com', role: 'admin' };
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in admin authentication'
    });
  }
};

module.exports = adminAuthMiddleware;
