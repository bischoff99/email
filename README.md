# Email Integration Server

A robust Node.js server for email integration with automated verification workflows, built with Express and featuring IMAP email client capabilities.

## Features

- ✅ **Email Management**: Connect to email accounts via IMAP
- ✅ **Verification Automation**: Automated email verification workflows
- ✅ **Link Extraction**: Extract verification links from emails
- ✅ **Code Extraction**: Extract verification codes from email content
- ✅ **RESTful API**: Well-documented API endpoints
- ✅ **Error Tracking**: Sentry integration for error monitoring
- ✅ **Security**: Rate limiting, helmet protection, CORS support
- ✅ **Logging**: Winston logger with configurable levels
- ✅ **Docker Support**: Ready for containerized deployment
- ✅ **Test Coverage**: Unit tests with Jest

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Email account with IMAP access enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd email-integration-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run tests:
```bash
npm test
```

5. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Health Check
```http
GET /health
```
Returns server health status and uptime.

#### Get Latest Emails
```http
GET /api/emails/latest/:sender?limit=10
```
Retrieves the latest emails from a specific sender.

**Parameters:**
- `sender` (path): Email address of the sender
- `limit` (query): Number of emails to retrieve (1-100, default: 1)

#### Search Emails
```http
POST /api/emails/search
```
Search emails using IMAP criteria.

**Body:**
```json
{
  "criteria": ["FROM", "example@email.com"],
  "options": { "limit": 10 }
}
```

#### Extract Verification Links
```http
POST /api/emails/extract-links
```
Extract verification links from email content.

**Body:**
```json
{
  "emailContent": {
    "text": "Click here to verify...",
    "html": "<a href='...'>Verify</a>"
  }
}
```

#### Email Verification Workflow
```http
POST /api/automation/verify-email
```
Execute automated email verification workflow.

**Body:**
```json
{
  "senderEmail": "noreply@service.com",
  "maxWaitTime": 60000
}
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `EMAIL_USER` | Email account username | Yes | - |
| `EMAIL_PASSWORD` | Email account password | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | No | info |
| `SENTRY_DSN` | Sentry error tracking DSN | No | - |
| `DATABASE_URL` | PostgreSQL connection string | No | - |
| `SUPABASE_URL` | Supabase project URL | No | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | No | - |

## Development

### Available Scripts

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build Docker image
npm run docker:build

# Run with Docker Compose
npm run docker:compose
```

### Project Structure

```
├── src/
│   ├── api/
│   │   ├── server.js         # Express server setup
│   │   └── routes/
│   │       ├── email.js       # Email endpoints
│   │       └── automation.js  # Automation endpoints
│   ├── core/
│   │   ├── config.js          # Configuration management
│   │   ├── emailClient.js     # IMAP email client
│   │   └── puppeteerHelper.js # Browser automation
│   └── automation/
│       └── emailVerification.js # Verification workflows
├── tests/
│   └── unit/
│       └── emailClient.test.js
├── .env.example               # Environment template
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
├── package.json              # Dependencies
└── server.js                 # Application entry point
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Docker deployment
- Cloud deployment (Heroku, AWS, DigitalOcean)
- PM2 process management
- Nginx reverse proxy setup

## Security

- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Helmet**: Security headers are set automatically
- **CORS**: Cross-origin requests are handled securely
- **Input Validation**: All inputs are validated before processing
- **Environment Variables**: Sensitive data is kept in environment variables
- **Error Handling**: Comprehensive error handling with Sentry integration

## Testing

The project uses Jest for testing. Tests cover:
- Email link extraction
- Verification code extraction
- Error handling
- Input validation

Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Email Connection Issues
- Ensure IMAP is enabled in your email settings
- Check if you need an app-specific password
- Verify firewall settings for port 993

### Docker Issues
- Ensure Docker and Docker Compose are installed
- Check if ports are available
- Review Docker logs: `docker-compose logs -f`

### Test Failures
- Run `npm install` to ensure all dependencies are installed
- Check environment variables in `.env`
- Review test output for specific error messages

## Support

For issues and questions:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review existing issues in the repository
3. Create a new issue with detailed information

## License

[Your License Here]

## Acknowledgments

- Express.js for the web framework
- node-imap for email integration
- Puppeteer for browser automation
- Jest for testing framework
- Sentry for error tracking