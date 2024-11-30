const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Make sure we're setting the user ID correctly
    req.user = { id: decoded.userId }; // or decoded.id depending on how you structured your JWT
    
    console.log('Auth middleware - User ID:', req.user.id); // Debug log
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};