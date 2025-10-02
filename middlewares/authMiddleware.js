// middlewares/authMiddleware.js
const authService = require('../services/authService');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  const decoded = authService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  
  req.user = decoded;
  next();
};

module.exports = authMiddleware;