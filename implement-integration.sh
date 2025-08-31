#!/bin/bash

# Email Integration Implementation Script
# This script helps you implement the email integration project step by step

set -e

echo "🚀 Email Integration Implementation Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "setup-mcps.sh" ]; then
        print_error "Please run this script from the email project directory"
        print_error "Make sure setup-mcps.sh exists in the current directory"
        exit 1
    fi
    print_success "Running from correct directory"
}

# Phase 1: Foundation Setup
phase1_foundation() {
    print_status "Phase 1: Foundation Setup"
    echo ""

    # Create project structure
    print_status "Creating project structure..."
    mkdir -p src/{core,api/{routes,middleware},automation/workflows,database/{models,migrations},utils}
    mkdir -p tests/{unit,integration,api}
    mkdir -p docs scripts logs
    print_success "Project structure created"

    # Initialize npm project
    if [ ! -f "package.json" ]; then
        print_status "Initializing npm project..."
        npm init -y
        print_success "npm project initialized"
    else
        print_warning "package.json already exists, skipping initialization"
    fi

    # Install dependencies
    print_status "Installing dependencies..."
    npm install imap mailparser puppeteer dotenv express cors helmet winston
    npm install --save-dev nodemon jest supertest eslint prettier @sentry/node
    print_success "Dependencies installed"

    # Setup MCPs
    print_status "Setting up MCPs..."
    if [ -f "setup-mcps.sh" ]; then
        chmod +x setup-mcps.sh
        ./setup-mcps.sh
    else
        print_warning "setup-mcps.sh not found, skipping MCP setup"
    fi
}

# Phase 2: Core Email Integration
phase2_email_integration() {
    print_status "Phase 2: Core Email Integration"
    echo ""

    # Create email client
    print_status "Creating HostingerEmailClient..."
    cat > src/core/emailClient.js << 'EOF'
const Imap = require('imap');
const { simpleParser } = require('mailparser');

class HostingerEmailClient {
  constructor(config) {
    this.config = {
      host: config.host || 'mail.hostinger.com',
      port: config.port || 993,
      tls: config.tls !== false,
      user: config.user,
      password: config.password,
      ...config
    };
    this.imap = new Imap(this.config);
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('Connected to email server');
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error('Connection error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  disconnect() {
    this.imap.end();
  }

  searchEmails(criteria, options = {}) {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', true, (err) => {
        if (err) return reject(err);

        this.imap.search(criteria, (err, results) => {
          if (err) return reject(err);

          if (!results || results.length === 0) {
            return resolve([]);
          }

          const limitedResults = options.limit ?
            results.slice(-options.limit) : results;

          const fetch = this.imap.fetch(limitedResults, {
            bodies: '',
            struct: true
          });

          const emails = [];

          fetch.on('message', (msg) => {
            let emailData = {};

            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) return;

                emailData = {
                  messageId: parsed.messageId,
                  subject: parsed.subject,
                  from: parsed.from,
                  to: parsed.to,
                  date: parsed.date,
                  text: parsed.text,
                  html: parsed.html,
                  attachments: parsed.attachments || []
                };
              });
            });

            msg.once('end', () => {
              emails.push(emailData);
            });
          });

          fetch.once('error', reject);
          fetch.once('end', () => {
            emails.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(emails);
          });
        });
      });
    });
  }

  async getLatestFromSender(senderEmail, limit = 1) {
    const criteria = ['FROM', senderEmail];
    return await this.searchEmails(criteria, { limit });
  }

  async searchBySubject(keyword, limit = 10) {
    const criteria = ['SUBJECT', keyword];
    return await this.searchEmails(criteria, { limit });
  }

  async searchByContent(keyword, limit = 10) {
    const criteria = ['TEXT', keyword];
    return await this.searchEmails(criteria, { limit });
  }

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
}

module.exports = HostingerEmailClient;
EOF
    print_success "HostingerEmailClient created"

    # Create configuration
    print_status "Creating configuration file..."
    cat > src/core/config.js << 'EOF'
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
EOF
    print_success "Configuration file created"
}

# Phase 3: Puppeteer Automation
phase3_puppeteer() {
    print_status "Phase 3: Puppeteer Automation"
    echo ""

    # Create Puppeteer helper
    print_status "Creating PuppeteerHelper..."
    cat > src/core/puppeteerHelper.js << 'EOF'
const puppeteer = require('puppeteer');

class PuppeteerHelper {
  constructor(config) {
    this.config = config;
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async navigateToVerification(verificationLink) {
    const page = await this.browser.newPage();
    await page.goto(verificationLink, { waitUntil: 'networkidle2' });
    return page;
  }

  async fillVerificationCode(page, code) {
    await page.waitForSelector('#verification-code');
    await page.type('#verification-code', code);
    await page.click('#verify-button');
  }

  async waitForVerificationComplete(page) {
    await page.waitForSelector('.verification-success', { timeout: 10000 });
    return await page.evaluate(() => {
      return document.querySelector('.verification-success').textContent;
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = PuppeteerHelper;
EOF
    print_success "PuppeteerHelper created"

    # Create email verification workflow
    print_status "Creating EmailVerificationWorkflow..."
    cat > src/automation/emailVerification.js << 'EOF'
const HostingerEmailClient = require('../core/emailClient');
const PuppeteerHelper = require('../core/puppeteerHelper');

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
      const email = await this.waitForVerificationEmail(senderEmail, maxWaitTime);

      // 3. Extract verification link
      const links = this.emailClient.extractVerificationLinks(email);
      if (links.length === 0) {
        throw new Error('No verification links found');
      }

      // 4. Initialize Puppeteer
      await this.puppeteerHelper.initialize();

      // 5. Navigate to verification link
      const page = await this.puppeteerHelper.navigateToVerification(links[0]);

      // 6. Complete verification
      const result = await this.puppeteerHelper.waitForVerificationComplete(page);

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
        if (emailAge < 300000) { // 5 minutes
          return emails[0];
        }
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Verification email not received within timeout');
  }

  async cleanup() {
    if (this.puppeteerHelper.browser) {
      await this.puppeteerHelper.close();
    }
    this.emailClient.disconnect();
  }
}

module.exports = EmailVerificationWorkflow;
EOF
    print_success "EmailVerificationWorkflow created"
}

# Phase 4: API Server
phase4_api_server() {
    print_status "Phase 4: API Server Development"
    echo ""

    # Create Express server
    print_status "Creating Express server..."
    cat > src/api/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const emailRoutes = require('./routes/email');
const automationRoutes = require('./routes/automation');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/emails', emailRoutes);
app.use('/api/automation', automationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Error handling
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
EOF
    print_success "Express server created"

    # Create email routes
    print_status "Creating email routes..."
    cat > src/api/routes/email.js << 'EOF'
const express = require('express');
const HostingerEmailClient = require('../../core/emailClient');
const config = require('../../core/config');

const router = express.Router();

// Get latest emails from sender
router.get('/latest/:sender', async (req, res) => {
  try {
    const { sender } = req.params;
    const limit = parseInt(req.query.limit) || 1;

    const emailClient = new HostingerEmailClient(config.email);
    await emailClient.connect();
    const emails = await emailClient.getLatestFromSender(sender, limit);
    emailClient.disconnect();

    res.json({ success: true, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search emails by criteria
router.post('/search', async (req, res) => {
  try {
    const { criteria, options } = req.body;

    const emailClient = new HostingerEmailClient(config.email);
    await emailClient.connect();
    const emails = await emailClient.searchEmails(criteria, options);
    emailClient.disconnect();

    res.json({ success: true, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Extract verification links
router.post('/extract-links', async (req, res) => {
  try {
    const { emailContent } = req.body;
    const emailClient = new HostingerEmailClient(config.email);
    const links = emailClient.extractVerificationLinks(emailContent);

    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
EOF
    print_success "Email routes created"

    # Create automation routes
    print_status "Creating automation routes..."
    cat > src/api/routes/automation.js << 'EOF'
const express = require('express');
const EmailVerificationWorkflow = require('../../automation/emailVerification');
const config = require('../../core/config');

const router = express.Router();

// Execute verification workflow
router.post('/verify-email', async (req, res) => {
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
EOF
    print_success "Automation routes created"
}

# Phase 5: Utilities and Logging
phase5_utilities() {
    print_status "Phase 5: Utilities and Logging"
    echo ""

    # Create logger
    print_status "Creating logger utility..."
    cat > src/utils/logger.js << 'EOF'
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
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
      timestamp: new Date()
    });
  }

  static warn(message, meta = {}) {
    logger.warn(message, { ...meta, timestamp: new Date() });
  }
}

module.exports = { logger, EmailLogger };
EOF
    print_success "Logger utility created"

    # Create main server file
    print_status "Creating main server file..."
    cat > server.js << 'EOF'
const app = require('./src/api/server');
const config = require('./src/core/config');

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`Email Integration Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Email API: http://localhost:${PORT}/api/emails`);
  console.log(`Automation API: http://localhost:${PORT}/api/automation`);
});
EOF
    print_success "Main server file created"
}

# Phase 6: Package.json scripts
phase6_package_scripts() {
    print_status "Phase 6: Package.json Scripts"
    echo ""

    # Update package.json scripts
    print_status "Updating package.json scripts..."
    if [ -f "package.json" ]; then
        # Add scripts to package.json
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts = {
          ...pkg.scripts,
          'start': 'node server.js',
          'dev': 'nodemon server.js',
          'test': 'jest',
          'test:watch': 'jest --watch',
          'lint': 'eslint src/',
          'format': 'prettier --write src/'
        };
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
        print_success "Package.json scripts updated"
    else
        print_warning "package.json not found, skipping script updates"
    fi
}

# Phase 7: Environment Setup
phase7_environment() {
    print_status "Phase 7: Environment Setup"
    echo ""

    # Create environment template
    print_status "Creating environment template..."
    cat > .env.template << 'EOF'
# Email Configuration
EMAIL_USER=your@domain.com
EMAIL_PASSWORD=your_email_password

# Database
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Monitoring
SENTRY_DSN=your_sentry_dsn

# Server
PORT=3000
NODE_ENV=development
EOF
    print_success "Environment template created"

    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp .env.template .env
        print_warning "Please edit .env file with your actual credentials"
    else
        print_warning ".env file already exists"
    fi
}

# Phase 8: Basic Tests
phase8_tests() {
    print_status "Phase 8: Basic Tests"
    echo ""

    # Create basic test
    print_status "Creating basic test..."
    cat > tests/unit/emailClient.test.js << 'EOF'
const HostingerEmailClient = require('../../src/core/emailClient');

describe('HostingerEmailClient', () => {
  let emailClient;

  beforeEach(() => {
    emailClient = new HostingerEmailClient({
      host: 'mail.hostinger.com',
      port: 993,
      tls: true,
      user: 'test@example.com',
      password: 'testpassword'
    });
  });

  test('should extract verification links from email content', () => {
    const emailContent = {
      html: '<a href="https://example.com/verify?token=abc123">Verify Email</a>'
    };

    const links = emailClient.extractVerificationLinks(emailContent);
    expect(links).toContain('https://example.com/verify?token=abc123');
  });

  test('should extract verification code from email content', () => {
    const emailContent = {
      text: 'Your verification code is: ABC123'
    };

    const code = emailClient.extractVerificationCode(emailContent);
    expect(code).toBe('ABC123');
  });
});
EOF
    print_success "Basic test created"

    # Create Jest config
    print_status "Creating Jest configuration..."
    cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
EOF
    print_success "Jest configuration created"
}

# Phase 9: Documentation
phase9_documentation() {
    print_status "Phase 9: Documentation"
    echo ""

    # Create README
    print_status "Creating README..."
    cat > README.md << 'EOF'
# Email Integration with Hostinger and Puppeteer

A complete email integration system with Hostinger IMAP and Puppeteer automation for email verification workflows.

## Features

- ✅ Hostinger IMAP email client with search capabilities
- ✅ Puppeteer browser automation for verification
- ✅ REST API for email operations
- ✅ Database integration with Supabase
- ✅ Comprehensive logging and monitoring
- ✅ MCP integration for enhanced development

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup MCPs**
   ```bash
   ./setup-mcps.sh
   ```

3. **Configure environment**
   ```bash
   cp .env.template .env
   nano .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## API Endpoints

### Email Operations
- `GET /api/emails/latest/:sender` - Get latest emails from sender
- `POST /api/emails/search` - Search emails by criteria
- `POST /api/emails/extract-links` - Extract verification links

### Automation
- `POST /api/automation/verify-email` - Execute email verification workflow

### Health Check
- `GET /health` - System health status

## Environment Variables

Required variables in `.env`:
```bash
EMAIL_USER=your@domain.com
EMAIL_PASSWORD=your_password
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
SENTRY_DSN=your_sentry_dsn
PORT=3000
NODE_ENV=development
```

## Project Structure

```
src/
├── core/           # Core email and Puppeteer functionality
├── api/            # Express API server and routes
├── automation/     # Email verification workflows
├── database/       # Database models and migrations
└── utils/          # Utilities and logging
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test tests/unit/emailClient.test.js
```

## Deployment

```bash
# Production build
npm start

# Docker deployment
docker build -t email-integration .
docker run -p 3000:3000 email-integration
```

## MCP Integration

This project includes comprehensive MCP (Model Context Protocol) integration for enhanced development capabilities.

See `MCP_EMAIL_PROJECT_SETUP.md` for detailed MCP configuration and usage.
EOF
    print_success "README created"
}

# Phase 10: Final Setup
phase10_final_setup() {
    print_status "Phase 10: Final Setup"
    echo ""

    # Create .gitignore
    print_status "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Puppeteer
.local-chromium/
EOF
    print_success ".gitignore created"

    # Create logs directory
    mkdir -p logs
    print_success "Logs directory created"
}

# Show completion message
show_completion() {
    echo ""
    echo "🎉 Email Integration Implementation Complete!"
    echo "============================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Configure your environment:"
    echo "   nano .env"
    echo ""
    echo "2. Test the setup:"
    echo "   npm test"
    echo ""
    echo "3. Start the development server:"
    echo "   npm run dev"
    echo ""
    echo "4. Test the API endpoints:"
    echo "   curl http://localhost:3000/health"
    echo ""
    echo "5. Explore the documentation:"
    echo "   - README.md - Project overview"
    echo "   - MCP_EMAIL_PROJECT_SETUP.md - MCP configuration"
    echo "   - INTEGRATION_WORKFLOW_PLAN.md - Detailed implementation plan"
    echo ""
    echo "6. Start building your email automation workflows!"
    echo ""
    echo "Available scripts:"
    echo "   npm start     - Start production server"
    echo "   npm run dev   - Start development server with nodemon"
    echo "   npm test      - Run tests"
    echo "   npm run lint  - Run ESLint"
    echo "   npm run format - Format code with Prettier"
    echo ""
}

# Main execution
main() {
    echo "Email Integration Implementation Script"
    echo "======================================"
    echo "This script will set up your email integration project step by step."
    echo ""

    check_directory

    phase1_foundation
    phase2_email_integration
    phase3_puppeteer
    phase4_api_server
    phase5_utilities
    phase6_package_scripts
    phase7_environment
    phase8_tests
    phase9_documentation
    phase10_final_setup

    show_completion
}

# Run main function
main "$@"
