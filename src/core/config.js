require('dotenv').config();

module.exports = {
  email: {
    host: 'mail.hostinger.com',
    port: 993,
    tls: true,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  },
  database: {
    url: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY
  },
  puppeteer: {
    headless: process.env.NODE_ENV === 'production',
    timeout: 30000
  },
  server: {
    port: process.env.PORT || 3000
  }
};


