const rateLimit = require('express-rate-limit');

// API Key authentication middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required. Provide in X-API-Key header or api_key query parameter.',
    });
  }

  const validApiKeys = (process.env.API_KEYS || '').split(',').filter(key => key.trim());
  
  if (validApiKeys.length === 0) {
    // In development, allow a default key
    if (process.env.NODE_ENV === 'development' && apiKey === 'dev-api-key') {
      return next();
    }
    
    return res.status(500).json({
      success: false,
      error: 'Server configuration error: No API keys configured.',
    });
  }

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key.',
    });
  }

  // Add rate limiting per API key
  const keyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per API key per window
    keyGenerator: () => apiKey,
    message: {
      success: false,
      error: 'Too many requests for this API key. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  keyLimiter(req, res, next);
};

// Enhanced validation for email endpoints
const validateEmailInput = (req, res, next) => {
  const { sender } = req.params;
  
  if (sender) {
    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sender)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format.',
      });
    }
    
    // Prevent email enumeration attacks
    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || '').split(',').filter(d => d.trim());
    if (allowedDomains.length > 0) {
      const domain = sender.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        return res.status(403).json({
          success: false,
          error: 'Email domain not allowed.',
        });
      }
    }
  }
  
  next();
};

module.exports = {
  apiKeyAuth,
  validateEmailInput,
};