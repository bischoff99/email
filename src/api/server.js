const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const emailRoutes = require('./routes/email');
const automationRoutes = require('./routes/automation');
const Sentry = require('@sentry/node');
const config = require('../core/config');
const fs = require('fs');
const path = require('path');

const app = express();

// Trust proxy for proper client IPs behind Replit proxy
app.set('trust proxy', 1);

// Disable x-powered-by header
app.disable('x-powered-by');

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure logger with file and console transports
const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' 
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
  })
];

// Add file transports only in development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});

// Make logger available globally
app.locals.logger = logger;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  skip: (req) => req.method === 'OPTIONS', // Skip preflight requests
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      endpoint: req.path,
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Stricter rate limit for automation endpoints
const automationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many automation requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'no-referrer' },
}));

// CORS configuration with Replit support
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check against configured origins
    const allowedOrigins = config.security.allowedOrigins;
    if (allowedOrigins.includes(origin.toLowerCase())) {
      return callback(null, true);
    }
    
    // Allow Replit domains
    if (/^https:\/\/.+\.repl\.co$/i.test(origin) || /^https:\/\/.+\.id\.repl\.co$/i.test(origin)) {
      return callback(null, true);
    }
    
    // Allow localhost/127.0.0.1 on any port in development
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return callback(null, true);
    }
    
    callback(null, false);
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Requested-With']
}));

// Sentry request handler must be first (if available)
if (Sentry.Handlers && Sentry.Handlers.requestHandler) {
  app.use(Sentry.Handlers.requestHandler());
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentLength: req.get('content-length'),
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`${req.method} ${req.url} - ${res.statusCode}`, {
      ip: req.ip,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
    });
  });
  
  next();
});

// Routes
app.use('/api/emails', emailRoutes);
app.use('/api/automation', automationLimiter, automationRoutes);

// Liveness probe (always healthy)
app.get('/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date() });
});

// Health check with more comprehensive checks
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../../package.json').version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    checks: {
      email: { status: 'unknown', message: 'Not tested' },
      database: { status: 'unknown', message: 'Not configured' },
    }
  };

  // Test email configuration if credentials are available
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      const HostingerEmailClient = require('../core/emailClient');
      const emailClient = new HostingerEmailClient(config.email);

      // Quick connection test (timeout after 5 seconds)
      await Promise.race([
        emailClient.connect().then(() => {
          emailClient.disconnect();
          healthCheck.checks.email = { status: 'healthy', message: 'Connection successful' };
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);
    } catch (error) {
      healthCheck.checks.email = { 
        status: 'unhealthy', 
        message: `Connection failed: ${error.message}` 
      };
      healthCheck.status = 'degraded';
    }
  } else {
    healthCheck.checks.email = { status: 'unconfigured', message: 'Email credentials not set' };
  }

  // Check if any critical systems are unhealthy
  const criticalChecks = Object.values(healthCheck.checks);
  const hasUnhealthy = criticalChecks.some(check => check.status === 'unhealthy');
  
  if (hasUnhealthy) {
    healthCheck.status = 'unhealthy';
    return res.status(503).json(healthCheck);
  }

  res.json(healthCheck);
});

// Debug endpoint (only in development)
if (process.env.NODE_ENV === 'development') {
  app.get('/debug-sentry', function mainHandler(req, res) {
    logger.info('Debug Sentry endpoint called', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(500).json({ error: 'Test error for Sentry' });
    throw new Error('My first Sentry error!');
  });
}

// Sentry error handler must be registered after all controllers and before any other error middleware
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // Log the error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    sentryId: res.sentry,
    timestamp: new Date(),
  });

  // Do not call next() after sending response to prevent double handling
});

module.exports = app;
