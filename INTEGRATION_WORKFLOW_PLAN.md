# Email Integration Workflow & Implementation Plan

## 🎯 Project Overview

**Goal**: Build a complete email integration system with Hostinger IMAP and Puppeteer automation for email verification workflows.

**Key Components**:

- Hostinger IMAP email client with search capabilities
- Puppeteer browser automation for verification
- API server for email operations
- Database storage and monitoring
- MCP integration for enhanced development

## 📋 Phase 1: Foundation Setup (Week 1)

### 1.1 Environment & Dependencies Setup

```bash
# Project initialization
mkdir email-integration-project
cd email-integration-project
npm init -y

# Install core dependencies
npm install imap mailparser puppeteer dotenv express cors helmet

# Install development dependencies
npm install --save-dev nodemon jest supertest eslint prettier

# Setup MCPs
./setup-mcps.sh
```

### 1.2 Project Structure Creation

```
email-integration-project/
├── src/
│   ├── core/
│   │   ├── emailClient.js
│   │   ├── config.js
│   │   └── puppeteerHelper.js
│   ├── api/
│   │   ├── server.js
│   │   ├── routes/
│   │   └── middleware/
│   ├── automation/
│   │   ├── emailVerification.js
│   │   └── workflows/
│   ├── database/
│   │   ├── models/
│   │   └── migrations/
│   └── utils/
│       ├── logger.js
│       └── helpers.js
├── tests/
├── docs/
└── scripts/
```

### 1.3 Configuration Setup

```javascript
// config.js
require("dotenv").config();

module.exports = {
  email: {
    host: "mail.hostinger.com",
    port: 993,
    tls: true,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
  },
  database: {
    url: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
  },
  puppeteer: {
    headless: process.env.NODE_ENV === "production",
    timeout: 30000,
  },
  server: {
    port: process.env.PORT || 3000,
  },
};
```

## 🔧 Phase 2: Core Email Integration (Week 2)

### 2.1 HostingerEmailClient Implementation

```javascript
// src/core/emailClient.js
const Imap = require("imap");
const { simpleParser } = require("mailparser");

class HostingerEmailClient {
  constructor(config) {
    this.config = config;
    this.imap = new Imap(config);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", resolve);
      this.imap.once("error", reject);
      this.imap.connect();
    });
  }

  async searchEmails(criteria, options = {}) {
    // Implementation for email search
  }

  async getLatestFromSender(senderEmail, limit = 1) {
    // Implementation for getting latest emails from sender
  }

  async searchBySubject(keyword, limit = 10) {
    // Implementation for subject search
  }

  extractVerificationLinks(emailContent) {
    // Implementation for link extraction
  }

  extractVerificationCode(emailContent) {
    // Implementation for code extraction
  }
}
```

### 2.2 Email Search & Filtering

```javascript
// Advanced search capabilities
async searchEmails(criteria, options = {}) {
  const searchCriteria = [];

  if (criteria.from) searchCriteria.push(['FROM', criteria.from]);
  if (criteria.subject) searchCriteria.push(['SUBJECT', criteria.subject]);
  if (criteria.since) searchCriteria.push(['SINCE', criteria.since]);
  if (criteria.before) searchCriteria.push(['BEFORE', criteria.before]);
  if (criteria.text) searchCriteria.push(['TEXT', criteria.text]);

  return await this.performSearch(searchCriteria, options);
}
```

### 2.3 Email Content Processing

```javascript
// Extract verification links and codes
extractVerificationLinks(emailContent) {
  const linkRegex = /https?:\/\/[^\s<>"]+(?:verify|confirm|activate)[^\s<>"]*/gi;
  const htmlContent = emailContent.html || emailContent.text || '';
  return htmlContent.match(linkRegex) || [];
}

extractVerificationCode(emailContent) {
  const codeRegex = /(?:code|token|otp)[\s:]*([A-Z0-9]{4,8})/gi;
  const content = emailContent.text || emailContent.html || '';
  const match = codeRegex.exec(content);
  return match ? match[1] : null;
}
```

## 🤖 Phase 3: Puppeteer Automation (Week 3)

### 3.1 PuppeteerHelper Implementation

```javascript
// src/core/puppeteerHelper.js
const puppeteer = require("puppeteer");

class PuppeteerHelper {
  constructor(config) {
    this.config = config;
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  async navigateToVerification(verificationLink) {
    const page = await this.browser.newPage();
    await page.goto(verificationLink, { waitUntil: "networkidle2" });
    return page;
  }

  async fillVerificationCode(page, code) {
    await page.waitForSelector("#verification-code");
    await page.type("#verification-code", code);
    await page.click("#verify-button");
  }

  async waitForVerificationComplete(page) {
    await page.waitForSelector(".verification-success", { timeout: 10000 });
    return await page.evaluate(() => {
      return document.querySelector(".verification-success").textContent;
    });
  }
}
```

### 3.2 Email Verification Workflow

```javascript
// src/automation/emailVerification.js
const HostingerEmailClient = require("../core/emailClient");
const PuppeteerHelper = require("../core/puppeteerHelper");

class EmailVerificationWorkflow {
  constructor(emailConfig, puppeteerConfig) {
    this.emailClient = new HostingerEmailClient(emailConfig);
    this.puppeteerHelper = new PuppeteerHelper(puppeteerConfig);
  }

  async executeVerificationWorkflow(senderEmail, maxWaitTime = 60000) {
    try {
      // 1. Connect to email
      await this.emailClient.connect();

      // 2. Wait for verification email
      const email = await this.waitForVerificationEmail(
        senderEmail,
        maxWaitTime
      );

      // 3. Extract verification link
      const links = this.emailClient.extractVerificationLinks(email);
      if (links.length === 0) {
        throw new Error("No verification links found");
      }

      // 4. Initialize Puppeteer
      await this.puppeteerHelper.initialize();

      // 5. Navigate to verification link
      const page = await this.puppeteerHelper.navigateToVerification(links[0]);

      // 6. Complete verification
      const result = await this.puppeteerHelper.waitForVerificationComplete(
        page
      );

      return { success: true, result };
    } catch (error) {
      throw new Error(`Verification workflow failed: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }

  async waitForVerificationEmail(senderEmail, maxWaitTime) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const emails = await this.emailClient.getLatestFromSender(senderEmail, 1);

      if (emails.length > 0) {
        const emailAge = Date.now() - new Date(emails[0].date).getTime();
        if (emailAge < 300000) {
          // 5 minutes
          return emails[0];
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error("Verification email not received within timeout");
  }

  async cleanup() {
    if (this.puppeteerHelper.browser) {
      await this.puppeteerHelper.browser.close();
    }
    this.emailClient.disconnect();
  }
}
```

## 🌐 Phase 4: API Server Development (Week 4)

### 4.1 Express Server Setup

```javascript
// src/api/server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const emailRoutes = require("./routes/email");
const automationRoutes = require("./routes/automation");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/emails", emailRoutes);
app.use("/api/automation", automationRoutes);

// Error handling
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
```

### 4.2 Email API Routes

```javascript
// src/api/routes/email.js
const express = require("express");
const HostingerEmailClient = require("../../core/emailClient");
const config = require("../../core/config");

const router = express.Router();
const emailClient = new HostingerEmailClient(config.email);

// Get latest emails from sender
router.get("/latest/:sender", async (req, res) => {
  try {
    const { sender } = req.params;
    const limit = parseInt(req.query.limit) || 1;

    await emailClient.connect();
    const emails = await emailClient.getLatestFromSender(sender, limit);

    res.json({ success: true, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search emails by criteria
router.post("/search", async (req, res) => {
  try {
    const { criteria, options } = req.body;

    await emailClient.connect();
    const emails = await emailClient.searchEmails(criteria, options);

    res.json({ success: true, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Extract verification links
router.post("/extract-links", async (req, res) => {
  try {
    const { emailContent } = req.body;
    const links = emailClient.extractVerificationLinks(emailContent);

    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### 4.3 Automation API Routes

```javascript
// src/api/routes/automation.js
const express = require("express");
const EmailVerificationWorkflow = require("../../automation/emailVerification");
const config = require("../../core/config");

const router = express.Router();

// Execute verification workflow
router.post("/verify-email", async (req, res) => {
  try {
    const { senderEmail, maxWaitTime } = req.body;

    const workflow = new EmailVerificationWorkflow(
      config.email,
      config.puppeteer
    );

    const result = await workflow.executeVerificationWorkflow(
      senderEmail,
      maxWaitTime
    );

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

## 🗄️ Phase 5: Database Integration (Week 5)

### 5.1 Supabase Integration

```javascript
// src/database/supabase.js
const { createClient } = require("@supabase/supabase-js");
const config = require("../core/config");

const supabase = createClient(
  config.database.supabaseUrl,
  config.database.supabaseKey
);

class EmailDatabase {
  async saveEmail(emailData) {
    const { data, error } = await supabase.from("emails").insert([
      {
        message_id: emailData.messageId,
        subject: emailData.subject,
        from: emailData.from,
        to: emailData.to,
        received_at: emailData.date,
        content: emailData.text,
        html_content: emailData.html,
      },
    ]);

    if (error) throw error;
    return data;
  }

  async saveVerificationResult(verificationData) {
    const { data, error } = await supabase.from("verifications").insert([
      {
        email: verificationData.email,
        verification_link: verificationData.link,
        status: verificationData.status,
        completed_at: new Date(),
        result: verificationData.result,
      },
    ]);

    if (error) throw error;
    return data;
  }

  async getVerificationHistory(email) {
    const { data, error } = await supabase
      .from("verifications")
      .select("*")
      .eq("email", email)
      .order("completed_at", { ascending: false });

    if (error) throw error;
    return data;
  }
}

module.exports = { supabase, EmailDatabase };
```

### 5.2 Database Schema

```sql
-- emails table
CREATE TABLE emails (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE,
  subject TEXT,
  from_email VARCHAR(255),
  to_email VARCHAR(255),
  received_at TIMESTAMP,
  content TEXT,
  html_content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- verifications table
CREATE TABLE verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  verification_link TEXT,
  status VARCHAR(50),
  completed_at TIMESTAMP,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- automation_logs table
CREATE TABLE automation_logs (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(100),
  status VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📊 Phase 6: Monitoring & Logging (Week 6)

### 6.1 Logging System

```javascript
// src/utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

class EmailLogger {
  static info(message, meta = {}) {
    logger.info(message, { ...meta, timestamp: new Date() });
  }

  static error(message, error = null, meta = {}) {
    logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
      timestamp: new Date(),
    });
  }

  static warn(message, meta = {}) {
    logger.warn(message, { ...meta, timestamp: new Date() });
  }
}

module.exports = { logger, EmailLogger };
```

### 6.2 Sentry Integration

```javascript
// src/utils/monitoring.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1.0,
});

class MonitoringService {
  static captureException(error, context = {}) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  static captureMessage(message, level = "info", context = {}) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }

  static setUser(user) {
    Sentry.setUser(user);
  }
}

module.exports = { Sentry, MonitoringService };
```

## 🚀 Phase 7: Testing & Quality Assurance (Week 7)

### 7.1 Unit Tests

```javascript
// tests/emailClient.test.js
const HostingerEmailClient = require("../src/core/emailClient");

describe("HostingerEmailClient", () => {
  let emailClient;

  beforeEach(() => {
    emailClient = new HostingerEmailClient({
      host: "mail.hostinger.com",
      port: 993,
      tls: true,
      user: "test@example.com",
      password: "testpassword",
    });
  });

  test("should extract verification links from email content", () => {
    const emailContent = {
      html: '<a href="https://example.com/verify?token=abc123">Verify Email</a>',
    };

    const links = emailClient.extractVerificationLinks(emailContent);
    expect(links).toContain("https://example.com/verify?token=abc123");
  });

  test("should extract verification code from email content", () => {
    const emailContent = {
      text: "Your verification code is: ABC123",
    };

    const code = emailClient.extractVerificationCode(emailContent);
    expect(code).toBe("ABC123");
  });
});
```

### 7.2 Integration Tests

```javascript
// tests/integration/emailVerification.test.js
const EmailVerificationWorkflow = require("../../src/automation/emailVerification");

describe("Email Verification Workflow", () => {
  test("should complete verification workflow successfully", async () => {
    const workflow = new EmailVerificationWorkflow(
      testEmailConfig,
      testPuppeteerConfig
    );

    const result = await workflow.executeVerificationWorkflow(
      "noreply@example.com",
      30000
    );

    expect(result.success).toBe(true);
  });
});
```

### 7.3 API Tests

```javascript
// tests/api/email.test.js
const request = require("supertest");
const app = require("../../src/api/server");

describe("Email API", () => {
  test("GET /api/emails/latest/:sender should return latest emails", async () => {
    const response = await request(app)
      .get("/api/emails/latest/noreply@example.com")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.emails)).toBe(true);
  });
});
```

## 🐳 Phase 8: Deployment & DevOps (Week 8)

### 8.1 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  email-integration:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASSWORD=${EMAIL_PASSWORD}
      - DATABASE_URL=${DATABASE_URL}
      - SENTRY_DSN=${SENTRY_DSN}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

### 8.2 Heroku Deployment

```json
// package.json scripts
{
  "scripts": {
    "start": "node src/api/server.js",
    "dev": "nodemon src/api/server.js",
    "test": "jest",
    "build": "echo 'No build step required'"
  }
}
```

```json
// Procfile
web: npm start
```

### 8.3 Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
EMAIL_USER=your@domain.com
EMAIL_PASSWORD=your_password
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
SENTRY_DSN=your_sentry_dsn
PORT=3000
```

## 📈 Phase 9: Performance & Optimization (Week 9)

### 9.1 Caching Strategy

```javascript
// src/utils/cache.js
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL);

class CacheService {
  static async get(key) {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async set(key, value, ttl = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  static async del(key) {
    await redis.del(key);
  }
}

module.exports = { CacheService };
```

### 9.2 Rate Limiting

```javascript
// src/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const emailSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many email search requests from this IP",
});

const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 verification attempts per hour
  message: "Too many verification attempts from this IP",
});

module.exports = { emailSearchLimiter, verificationLimiter };
```

## 🔄 Phase 10: Maintenance & Monitoring (Week 10+)

### 10.1 Health Checks

```javascript
// src/api/routes/health.js
const express = require("express");
const HostingerEmailClient = require("../../core/emailClient");
const { supabase } = require("../../database/supabase");

const router = express.Router();

router.get("/health", async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date(),
    services: {},
  };

  // Check email service
  try {
    const emailClient = new HostingerEmailClient(config.email);
    await emailClient.connect();
    health.services.email = "healthy";
    emailClient.disconnect();
  } catch (error) {
    health.services.email = "unhealthy";
    health.status = "degraded";
  }

  // Check database
  try {
    await supabase.from("emails").select("count").limit(1);
    health.services.database = "healthy";
  } catch (error) {
    health.services.database = "unhealthy";
    health.status = "degraded";
  }

  res.json(health);
});

module.exports = router;
```

### 10.2 Automated Monitoring

```javascript
// src/utils/monitoring.js
class SystemMonitor {
  static async checkEmailService() {
    try {
      const emailClient = new HostingerEmailClient(config.email);
      await emailClient.connect();
      emailClient.disconnect();
      return { status: "healthy", timestamp: new Date() };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  static async checkDatabaseConnection() {
    try {
      await supabase.from("emails").select("count").limit(1);
      return { status: "healthy", timestamp: new Date() };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  static async generateHealthReport() {
    const emailHealth = await this.checkEmailService();
    const dbHealth = await this.checkDatabaseConnection();

    return {
      timestamp: new Date(),
      services: {
        email: emailHealth,
        database: dbHealth,
      },
      overallStatus:
        emailHealth.status === "healthy" && dbHealth.status === "healthy"
          ? "healthy"
          : "degraded",
    };
  }
}
```

## 🎯 Implementation Timeline

| Week | Phase                      | Deliverables                             | Status |
| ---- | -------------------------- | ---------------------------------------- | ------ |
| 1    | Foundation Setup           | Project structure, dependencies, MCPs    | ⏳     |
| 2    | Core Email Integration     | HostingerEmailClient, search, filtering  | ⏳     |
| 3    | Puppeteer Automation       | PuppeteerHelper, verification workflows  | ⏳     |
| 4    | API Server Development     | Express server, routes, middleware       | ⏳     |
| 5    | Database Integration       | Supabase integration, schema, models     | ⏳     |
| 6    | Monitoring & Logging       | Winston, Sentry, monitoring service      | ⏳     |
| 7    | Testing & QA               | Unit tests, integration tests, API tests | ⏳     |
| 8    | Deployment & DevOps        | Docker, Heroku, environment config       | ⏳     |
| 9    | Performance & Optimization | Caching, rate limiting, optimization     | ⏳     |
| 10+  | Maintenance & Monitoring   | Health checks, automated monitoring      | ⏳     |

## 🚀 Quick Start Commands

```bash
# 1. Clone and setup
git clone <repository>
cd email-integration-project
npm install

# 2. Setup MCPs
./setup-mcps.sh

# 3. Configure environment
cp .env.template .env
nano .env

# 4. Run tests
npm test

# 5. Start development server
npm run dev

# 6. Deploy to production
npm run deploy
```

## 📊 Success Metrics

- **Email Processing**: 99.9% uptime for email operations
- **Verification Success**: 95% success rate for email verification
- **Response Time**: < 2 seconds for email search operations
- **Error Rate**: < 1% error rate in production
- **Test Coverage**: > 90% code coverage

This comprehensive workflow and plan provides a structured approach to building your email integration system with Hostinger and Puppeteer automation, ensuring scalability, reliability, and maintainability.
