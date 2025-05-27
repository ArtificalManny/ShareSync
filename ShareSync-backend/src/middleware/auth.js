const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('Auth Middleware - No token provided');
    return res.status(401).json({ message: 'Access denied: No token provided' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    console.log('Auth Middleware - Token verified for user:', verified.id);
    next();
  } catch (err) {
    console.error('Auth Middleware - Invalid token:', err.message);
    res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = authenticateToken;