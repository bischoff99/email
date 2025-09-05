# Email Integration Server - Replit Setup

## Overview
This is a Node.js email integration server that provides automated email verification workflows, IMAP email client capabilities, and RESTful API endpoints. The server has been configured for optimal performance on Replit.

## Current State
- **Status**: ✅ Production ready and running
- **Port**: 8000 (development workflow) - deployments use environment-provided PORT
- **Public URL**: https://workspace.nojus9.repl.co
- **Environment**: Development (switches to production on deployment)

## Recent Changes (September 5, 2025)
- Configured server to bind to 0.0.0.0 for external access
- Updated CORS configuration to support Replit domains (*.repl.co, *.id.repl.co)
- Added trust proxy support for proper client IP detection
- Enhanced logging to show Replit public URLs when available
- Optimized Winston logging (file transports disabled in production)
- Added comprehensive Puppeteer browser flags for Replit sandboxing
- Relaxed production environment validation to warnings instead of errors
- Fixed CORS error handling and added security headers

## Project Architecture
### Backend API Server
- **Framework**: Express.js 5 with security middleware (Helmet, CORS, Rate Limiting)
- **Email Integration**: IMAP client for email retrieval and parsing
- **Browser Automation**: Puppeteer for verification link handling
- **Error Tracking**: Sentry integration with proper request context
- **Logging**: Winston with JSON structured logs
- **Testing**: Jest unit and integration tests

### Key Components
- `/src/api/server.js` - Main Express application setup
- `/src/core/config.js` - Environment configuration and validation
- `/src/core/emailClient.js` - IMAP email client
- `/src/core/puppeteerHelper.js` - Browser automation utilities
- `/src/automation/emailVerification.js` - Verification workflows

## API Endpoints
- `GET /health` - Health check with comprehensive status
- `GET /api/emails/latest/:sender` - Retrieve latest emails
- `POST /api/emails/search` - Search emails with IMAP criteria
- `POST /api/emails/extract-links` - Extract verification links
- `POST /api/automation/verify-email` - Automated verification workflow

## User Preferences
- **No specific preferences documented yet**
- Uses standard Node.js/Express patterns
- Prefers structured logging with JSON format
- Security-first approach with comprehensive middleware

## Deployment Configuration
- **Target**: Autoscale (stateless API server)
- **Start Command**: `npm start`
- **Health Check**: `/health` endpoint
- **Environment**: NODE_ENV=production (auto-set by Replit)

## Required Secrets (Optional)
The server can run without these but full functionality requires:
- `EMAIL_USER` - Email account username
- `EMAIL_PASSWORD` - Email account password
- `SENTRY_DSN` - Error tracking (optional)
- `SECRET_KEY` - API authentication (optional)

## Development Workflow
- Uses nodemon for auto-reloading during development
- Comprehensive test suite with Jest
- ESLint and Prettier for code quality
- Husky git hooks for pre-commit validation