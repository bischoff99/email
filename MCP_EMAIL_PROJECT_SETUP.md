# MCP Setup for Email Integration with Hostinger and Puppeteer Automation

This guide provides a comprehensive MCP (Model Context Protocol) configuration specifically designed for your email integration project with Hostinger and Puppeteer automation.

## Project Overview

Your project involves:
- **Email Integration**: Hostinger IMAP email client with search capabilities
- **Puppeteer Automation**: Browser automation for email verification workflows
- **Node.js Backend**: Email client, API server, and automation scripts
- **Development Tools**: Testing, debugging, and deployment support

## MCP Configuration Structure

### 1. Core Development MCPs

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {}
    },
    "sequentialthinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {}
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {}
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@agent-infra/mcp-server-browser"],
      "env": {}
    }
  }
}
```

### 2. Email & Communication MCPs

```json
{
  "mcpServers": {
    "email": {
      "command": "npx",
      "args": ["-y", "mcp-server-email"],
      "env": {
        "EMAIL_HOST": "mail.hostinger.com",
        "EMAIL_PORT": "993",
        "EMAIL_USER": "${EMAIL_USER}",
        "EMAIL_PASSWORD": "${EMAIL_PASSWORD}"
      }
    },
    "smtp": {
      "command": "npx",
      "args": ["-y", "mcp-server-smtp"],
      "env": {
        "SMTP_HOST": "mail.hostinger.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "${EMAIL_USER}",
        "SMTP_PASSWORD": "${EMAIL_PASSWORD}"
      }
    },
    "imap": {
      "command": "npx",
      "args": ["-y", "mcp-server-imap"],
      "env": {
        "IMAP_HOST": "mail.hostinger.com",
        "IMAP_PORT": "993",
        "IMAP_USER": "${EMAIL_USER}",
        "IMAP_PASSWORD": "${EMAIL_PASSWORD}"
      }
    }
  }
}
```

### 3. Automation & Testing MCPs

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "mcp-server-puppeteer"],
      "env": {
        "PUPPETEER_HEADLESS": "false",
        "PUPPETEER_TIMEOUT": "30000"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "mcp-server-playwright"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0"
      }
    },
    "selenium": {
      "command": "npx",
      "args": ["-y", "mcp-server-selenium"],
      "env": {}
    },
    "testing": {
      "command": "npx",
      "args": ["-y", "mcp-server-testing"],
      "env": {}
    }
  }
}
```

### 4. Database & Storage MCPs

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "mcp-server-postgres"],
      "env": {
        "POSTGRES_URL": "${DATABASE_URL}"
      }
    },
    "redis": {
      "command": "npx",
      "args": ["-y", "mcp-server-redis"],
      "env": {
        "REDIS_URL": "${REDIS_URL}"
      }
    }
  }
}
```

### 5. API & Integration MCPs

```json
{
  "mcpServers": {
    "http": {
      "command": "npx",
      "args": ["-y", "mcp-server-http"],
      "env": {}
    },
    "rest": {
      "command": "npx",
      "args": ["-y", "mcp-server-rest"],
      "env": {}
    },
    "webhook": {
      "command": "npx",
      "args": ["-y", "mcp-server-webhook"],
      "env": {}
    },
    "cron": {
      "command": "npx",
      "args": ["-y", "mcp-server-cron"],
      "env": {}
    }
  }
}
```

### 6. Monitoring & Logging MCPs

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_DSN": "${SENTRY_DSN}"
      }
    },
    "logging": {
      "command": "npx",
      "args": ["-y", "mcp-server-logging"],
      "env": {
        "LOG_LEVEL": "info"
      }
    },
    "metrics": {
      "command": "npx",
      "args": ["-y", "mcp-server-metrics"],
      "env": {}
    }
  }
}
```

### 7. Deployment & Infrastructure MCPs

```json
{
  "mcpServers": {
    "heroku": {
      "command": "npx",
      "args": ["-y", "@heroku/mcp-server"],
      "env": {
        "HEROKU_API_KEY": "${HEROKU_API_KEY}"
      }
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "mcp-server-docker"],
      "env": {}
    },
    "kubernetes": {
      "command": "npx",
      "args": ["-y", "mcp-server-kubernetes"],
      "env": {}
    },
    "aws": {
      "command": "npx",
      "args": ["-y", "mcp-server-aws"],
      "env": {
        "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
        "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}"
      }
    }
  }
}
```

## Complete MCP Configuration

Here's the complete `~/.cursor/mcp/config.json` for your email project:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {}
    },
    "sequentialthinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {}
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {}
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@agent-infra/mcp-server-browser"],
      "env": {}
    },
    "email": {
      "command": "npx",
      "args": ["-y", "mcp-server-email"],
      "env": {
        "EMAIL_HOST": "mail.hostinger.com",
        "EMAIL_PORT": "993",
        "EMAIL_USER": "${EMAIL_USER}",
        "EMAIL_PASSWORD": "${EMAIL_PASSWORD}"
      }
    },
    "imap": {
      "command": "npx",
      "args": ["-y", "mcp-server-imap"],
      "env": {
        "IMAP_HOST": "mail.hostinger.com",
        "IMAP_PORT": "993",
        "IMAP_USER": "${EMAIL_USER}",
        "IMAP_PASSWORD": "${EMAIL_PASSWORD}"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "mcp-server-puppeteer"],
      "env": {
        "PUPPETEER_HEADLESS": "false",
        "PUPPETEER_TIMEOUT": "30000"
      }
    },
    "testing": {
      "command": "npx",
      "args": ["-y", "mcp-server-testing"],
      "env": {}
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    },
    "http": {
      "command": "npx",
      "args": ["-y", "mcp-server-http"],
      "env": {}
    },
    "webhook": {
      "command": "npx",
      "args": ["-y", "mcp-server-webhook"],
      "env": {}
    },
    "cron": {
      "command": "npx",
      "args": ["-y", "mcp-server-cron"],
      "env": {}
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_DSN": "${SENTRY_DSN}"
      }
    },
    "logging": {
      "command": "npx",
      "args": ["-y", "mcp-server-logging"],
      "env": {
        "LOG_LEVEL": "info"
      }
    },
    "heroku": {
      "command": "npx",
      "args": ["-y", "@heroku/mcp-server"],
      "env": {
        "HEROKU_API_KEY": "${HEROKU_API_KEY}"
      }
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "mcp-server-docker"],
      "env": {}
    }
  }
}
```

## Environment Variables Setup

Create a `.env` file in your project root:

```bash
# Email Configuration
EMAIL_USER=your@domain.com
EMAIL_PASSWORD=your_email_password

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url

# Monitoring
SENTRY_DSN=your_sentry_dsn

# Deployment
HEROKU_API_KEY=your_heroku_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

## MCP Usage Examples for Email Project

### 1. Email Operations
```javascript
// Search emails using MCP
const emails = await mcp.email.search({
  from: 'noreply@example.com',
  subject: 'verification',
  limit: 5
});

// Extract verification links
const links = await mcp.email.extractLinks(emails[0]);
```

### 2. Puppeteer Automation
```javascript
// Launch browser and automate email verification
const browser = await mcp.puppeteer.launch({ headless: false });
const page = await browser.newPage();

// Navigate to verification link
await page.goto(verificationLink);
await mcp.puppeteer.waitForSelector(page, '#verification-code');
```

### 3. API Testing
```javascript
// Test email API endpoints
const response = await mcp.http.get('/api/emails/latest/noreply@example.com');
const emails = response.data.emails;
```

### 4. Database Operations
```javascript
// Store email data in Supabase
await mcp.supabase.insert('emails', {
  message_id: email.messageId,
  subject: email.subject,
  from: email.from,
  received_at: email.date
});
```

### 5. Monitoring & Logging
```javascript
// Log email operations
await mcp.logging.info('Email verification completed', {
  email: emailAddress,
  timestamp: new Date()
});

// Track errors with Sentry
await mcp.sentry.captureException(error);
```

## Installation Commands

Run these commands to install the MCP servers:

```bash
# Core MCPs
npm install -g @upstash/context7-mcp
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @agent-infra/mcp-server-browser

# Email MCPs
npm install -g mcp-server-email
npm install -g mcp-server-imap
npm install -g mcp-server-smtp

# Automation MCPs
npm install -g mcp-server-puppeteer
npm install -g mcp-server-testing

# Database MCPs
npm install -g @supabase/mcp-server-supabase
npm install -g mcp-server-postgres
npm install -g mcp-server-redis

# API MCPs
npm install -g mcp-server-http
npm install -g mcp-server-webhook
npm install -g mcp-server-cron

# Monitoring MCPs
npm install -g @sentry/mcp-server
npm install -g mcp-server-logging
npm install -g mcp-server-metrics

# Deployment MCPs
npm install -g @heroku/mcp-server
npm install -g mcp-server-docker
npm install -g mcp-server-kubernetes
npm install -g mcp-server-aws
```

## Project-Specific MCP Workflows

### Email Verification Workflow
1. **Email Monitoring**: Use `mcp.email` to monitor for verification emails
2. **Link Extraction**: Extract verification links using `mcp.email.extractLinks`
3. **Browser Automation**: Use `mcp.puppeteer` to navigate and complete verification
4. **Database Storage**: Store results using `mcp.supabase`
5. **Logging**: Track operations with `mcp.logging`

### API Development Workflow
1. **HTTP Testing**: Use `mcp.http` to test API endpoints
2. **Webhook Handling**: Use `mcp.webhook` for real-time email notifications
3. **Scheduled Tasks**: Use `mcp.cron` for periodic email checks
4. **Error Monitoring**: Use `mcp.sentry` for error tracking

### Deployment Workflow
1. **Containerization**: Use `mcp.docker` for container management
2. **Platform Deployment**: Use `mcp.heroku` for Heroku deployment
3. **Monitoring**: Use `mcp.logging` and `mcp.sentry` for production monitoring

## Troubleshooting

### Common Issues
1. **MCP not loading**: Restart Cursor after configuration changes
2. **Authentication errors**: Ensure environment variables are set correctly
3. **Email connection issues**: Verify Hostinger IMAP settings
4. **Puppeteer errors**: Check browser installation and permissions

### Verification Commands
```bash
# Test email MCP
npx -y mcp-server-email --help

# Test Puppeteer MCP
npx -y mcp-server-puppeteer --help

# Check MCP configuration
cat ~/.cursor/mcp/config.json

# List installed MCPs
npm list -g | grep mcp
```

## Next Steps

1. **Install MCPs**: Run the installation commands above
2. **Configure Environment**: Set up your `.env` file with credentials
3. **Test Integration**: Verify email connection and Puppeteer automation
4. **Deploy**: Use deployment MCPs to deploy your email automation system
5. **Monitor**: Set up monitoring and logging for production use

This MCP configuration provides a comprehensive toolkit for your email integration project, enabling seamless automation, testing, and deployment workflows.
