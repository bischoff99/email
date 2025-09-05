require('dotenv').config();

// Environment validation function
function validateEnvironment() {
  const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missing.join(', ')}`);
    console.warn('📝 Please set these variables in your .env file or environment');
    
    // Only fail in production
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot start in production without required environment variables');
      process.exit(1);
    }
  }
  
  // Validate production-specific requirements (warnings only to allow partial deployment)
  if (process.env.NODE_ENV === 'production') {
    const productionRequiredVars = ['API_KEYS', 'SECRET_KEY'];
    const productionMissing = [];
    
    for (const envVar of productionRequiredVars) {
      if (!process.env[envVar] || process.env[envVar].includes('development') || process.env[envVar].includes('your-')) {
        productionMissing.push(envVar);
      }
    }
    
    if (productionMissing.length > 0) {
      console.warn(`⚠️  Production environment detected but insecure values found in: ${productionMissing.join(', ')}`);
      console.warn('🔒 Please set secure values for production deployment');
      console.warn('📝 Some features may not work properly without proper configuration');
    }
  }
}

// Run validation
validateEnvironment();

module.exports = {
  email: {
    host: process.env.EMAIL_HOST || 'mail.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT) || 993,
    tls: process.env.EMAIL_SECURE !== 'false',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
  },
  database: {
    url: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
  },
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000,
  },
  server: {
    port: parseInt(process.env.PORT) || 5000,
    host: process.env.HOST || '0.0.0.0',
  },
  security: {
    secretKey: process.env.SECRET_KEY,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim().toLowerCase()).filter(Boolean) || ['http://localhost:5000', 'http://127.0.0.1:5000', 'https://localhost:5000', 'https://127.0.0.1:5000'],
    allowedEmailDomains: process.env.ALLOWED_EMAIL_DOMAINS?.split(',').filter(d => d.trim()) || [],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
};
