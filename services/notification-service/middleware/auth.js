const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

const authMiddleware = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware called for:', req.method, req.path);

    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔑 Token extracted, length:', token.length);

    // Verify token with auth service
    console.log('📞 Calling auth service at:', `${AUTH_SERVICE_URL}/api/auth/verify`);
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      token
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Auth service response:', response.status, response.data);

    if (!response.data.valid) {
      console.log('❌ Token validation failed');
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    // Add user info to request
    req.userId = response.data.userId;
    req.user = response.data.user;

    console.log('✅ Auth successful for user:', req.userId);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    if (error.response) {
      // Auth service responded with error
      console.error('❌ Auth service error response:', error.response.status, error.response.data);
      return res.status(error.response.status).json({
        error: error.response.data.error || 'Authentication failed'
      });
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      // Auth service is unavailable
      console.error('❌ Auth service unavailable:', error.message);
      return res.status(503).json({
        error: 'Authentication service unavailable'
      });
    } else {
      // Other errors
      console.error('❌ Auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
};

// Service-to-service authentication (for internal API calls)
const serviceAuthMiddleware = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  const expectedKey = process.env.SERVICE_API_KEY;

  if (!expectedKey) {
    console.warn('⚠️ SERVICE_API_KEY not configured. Service authentication disabled.');
    return next();
  }

  if (!serviceKey || serviceKey !== expectedKey) {
    return res.status(401).json({
      error: 'Invalid service key'
    });
  }

  next();
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without auth
    }

    const token = authHeader.substring(7);

    // Verify token with auth service
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      token
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.valid) {
      req.userId = response.data.userId;
      req.user = response.data.user;
    }
    
    next();
  } catch (error) {
    // Continue without auth if token verification fails
    next();
  }
};

module.exports = authMiddleware;
module.exports.serviceAuth = serviceAuthMiddleware;
module.exports.optionalAuth = optionalAuthMiddleware;
