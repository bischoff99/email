# Quick Start Guide - Email Integration with MCPs

Get your email integration project with Hostinger and Puppeteer automation up and running quickly with MCPs (Model Context Protocol).

## 🚀 Quick Setup (5 minutes)

### 1. Run the Setup Script

```bash
# Make script executable and run
chmod +x setup-mcps.sh
./setup-mcps.sh
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.template .env

# Edit with your credentials
nano .env
```

### 3. Restart Cursor

Restart Cursor to load the new MCP configuration.

## 📋 What You Get

### Core MCPs (Always Available)

- ✅ **Context7**: Documentation and code examples
- ✅ **Sequential Thinking**: Advanced problem-solving
- ✅ **Filesystem**: File system access
- ✅ **Browser**: Web browser automation

### Email-Specific MCPs (If Available)

- 📧 **Email**: General email operations
- 📧 **IMAP**: IMAP email access (Hostinger)
- 📧 **SMTP**: SMTP email sending

### Automation MCPs (If Available)

- 🤖 **Puppeteer**: Browser automation
- 🧪 **Testing**: Testing utilities

### Service MCPs

- 🗄️ **Supabase**: Database operations
- 📊 **Sentry**: Error monitoring
- 🚀 **Heroku**: Deployment
- 🐳 **Docker**: Container management

## 🎯 Key Workflows

### Email Verification Workflow

```javascript
// 1. Monitor for verification emails
const emails = await mcp.email.search({
  from: "noreply@example.com",
  subject: "verification",
});

// 2. Extract verification links
const links = await mcp.email.extractLinks(emails[0]);

// 3. Automate browser verification
const browser = await mcp.puppeteer.launch();
await page.goto(links[0]);
```

### API Development Workflow

```javascript
// 1. Test API endpoints
const response = await mcp.http.get("/api/emails/latest/sender@example.com");

// 2. Store data in database
await mcp.supabase.insert("emails", emailData);

// 3. Monitor for errors
await mcp.sentry.captureException(error);
```

## 🔧 Configuration Files

| File                         | Purpose                        |
| ---------------------------- | ------------------------------ |
| `mcp-config.json`            | MCP server configuration       |
| `setup-mcps.sh`              | Automated installation script  |
| `.env.template`              | Environment variables template |
| `MCP_EMAIL_PROJECT_SETUP.md` | Detailed setup guide           |
| `PROJECT_STRUCTURE.md`       | Project organization           |

## 🛠️ Environment Variables

Required variables in `.env`:

```bash
# Email (Required)
EMAIL_USER=your@domain.com
EMAIL_PASSWORD=your_password

# Database (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn

# Deployment (Optional)
HEROKU_API_KEY=your_heroku_key
```

## 🧪 Testing Your Setup

### Test Core MCPs

```bash
# Test Context7 MCP
npx -y @upstash/context7-mcp --help

# Test Sequential Thinking MCP
npx -y @modelcontextprotocol/server-sequential-thinking --help

# Test Filesystem MCP
npx -y @modelcontextprotocol/server-filesystem --help

# Test Browser MCP
npx -y @agent-infra/mcp-server-browser --help
```

### Test Service MCPs

```bash
# Test Supabase MCP
npx -y @supabase/mcp-server-supabase --help

# Test Sentry MCP
npx -y @sentry/mcp-server --help

# Test Heroku MCP
npx -y @heroku/mcp-server --help
```

### Check Configuration

```bash
# View MCP configuration
cat ~/.cursor/mcp/config.json

# List installed MCPs
npm list -g | grep mcp
```

## 📚 Usage Examples

### Email Operations

```javascript
// Search emails
const emails = await mcp.email.search({
  from: "noreply@example.com",
  limit: 5,
});

// Extract verification links
const links = await mcp.email.extractLinks(emails[0]);
```

### Browser Automation

```javascript
// Launch browser
const browser = await mcp.puppeteer.launch({ headless: false });
const page = await browser.newPage();

// Navigate and interact
await page.goto("https://example.com/verify");
await page.type("#code", verificationCode);
```

### Database Operations

```javascript
// Store email data
await mcp.supabase.insert("emails", {
  message_id: email.messageId,
  subject: email.subject,
  received_at: email.date,
});
```

### Monitoring

```javascript
// Log operations
await mcp.logging.info("Email processed", { email: emailAddress });

// Track errors
await mcp.sentry.captureException(error);
```

## 🔍 Troubleshooting

### Common Issues

1. **MCP not loading**

   ```bash
   # Restart Cursor after configuration changes
   # Check configuration file
   cat ~/.cursor/mcp/config.json
   ```

2. **Authentication errors**

   ```bash
   # Verify environment variables
   cat .env
   # Ensure credentials are correct
   ```

3. **Email connection issues**

   ```bash
   # Verify Hostinger IMAP settings
   # Host: mail.hostinger.com
   # Port: 993 (SSL/TLS)
   ```

4. **Puppeteer errors**
   ```bash
   # Check browser installation
   # Ensure proper permissions
   ```

### Verification Commands

```bash
# Test MCP installation
npx -y @upstash/context7-mcp --help

# Check Node.js and npm
node --version
npm --version

# List global packages
npm list -g | grep mcp
```

## 📖 Next Steps

1. **Explore Documentation**: Read `MCP_EMAIL_PROJECT_SETUP.md` for detailed information
2. **Set Up Project**: Create your email integration files using the provided examples
3. **Test Integration**: Verify email connection and Puppeteer automation
4. **Deploy**: Use deployment MCPs to deploy your system
5. **Monitor**: Set up monitoring and logging for production

## 🆘 Need Help?

- **Documentation**: `MCP_EMAIL_PROJECT_SETUP.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`
- **Configuration**: `mcp-config.json`
- **Setup Script**: `setup-mcps.sh`

## 🎉 You're Ready!

Your email integration project is now configured with comprehensive MCP support for:

- ✅ Email operations and automation
- ✅ Browser automation with Puppeteer
- ✅ Database operations with Supabase
- ✅ Monitoring and error tracking
- ✅ Deployment and infrastructure management

Start building your email automation workflows!
