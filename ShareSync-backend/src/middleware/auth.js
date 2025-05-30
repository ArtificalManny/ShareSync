const jwt = require('jsonwebtoken');

   module.exports = function (req, res, next) {
     const token = req.header('Authorization')?.replace('Bearer ', '');
     console.log('Auth Middleware - Token received:', token);

     if (!token) {
       console.log('Auth Middleware - No token provided');
       return res.status(401).json({ message: 'No token, authorization denied' });
     }

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       console.log('Auth Middleware - Token decoded:', decoded);
       req.user = decoded.user;
       next();
     } catch (err) {
       console.error('Auth Middleware - Token verification failed:', err.message);
       res.status(401).json({ message: 'Token is not valid' });
     }
   };