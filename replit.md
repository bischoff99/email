# Email Integration Server - Replit Setup

## Overview
This is a Node.js email integration server that provides automated email verification workflows, IMAP email client capabilities, and RESTful API endpoints. The server has been configured for optimal performance on Replit.

## Current State
- **Status**: ✅ Production ready and running
- **Port**: 8000 (development workflow) - deployments use environment-provided PORT
- **Public URL**: https://workspace.nojus9.repl.co
- **Environment**: Development (switches to production on deployment)

## Recent Changes (September 5, 2025)
- **✅ Integrated Hugging Face AI service** with user's Pro account for email intelligence
- Added comprehensive AI endpoints for email analysis, categorization, and response generation
- Multi-provider AI support with automatic fallback (Hugging Face → Claude → OpenAI → Gemini)
- Enhanced AI features: sentiment analysis, language detection, action item extraction
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
- `/src/core/huggingfaceService.js` - **NEW** Hugging Face AI service with Pro features
- `/src/core/aiService.js` - Anthropic Claude AI service (fallback)
- `/src/core/multiAIService.js` - **NEW** Multi-provider AI orchestration
- `/src/core/puppeteerHelper.js` - Browser automation utilities
- `/src/automation/emailVerification.js` - Verification workflows
- `/src/api/routes/ai.js` - **NEW** AI-powered email processing endpoints

## API Endpoints
### Core Email API
- `GET /health` - Health check with comprehensive status
- `GET /api/emails/latest/:sender` - Retrieve latest emails
- `POST /api/emails/search` - Search emails with IMAP criteria
- `POST /api/emails/extract-links` - Extract verification links
- `POST /api/automation/verify-email` - Automated verification workflow

### **NEW** AI-Powered Email Processing
- `GET /api/ai/status` - AI service status and capabilities
- `POST /api/ai/analyze-email` - Comprehensive email analysis (category, sentiment, priority)
- `POST /api/ai/generate-response` - AI-generated professional email responses
- `POST /api/ai/categorize-emails` - Batch email categorization
- `POST /api/ai/extract-actions` - Extract action items and deadlines
- `POST /api/ai/summarize-thread` - Summarize email conversation threads
- `POST /api/ai/smart-process` - Combined analysis and response generation

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

## Required Secrets
### Email Integration (Required for full functionality)
- `EMAIL_USER` - Email account username (✅ configured: zubrusnojus@thrivzly.com)
- `EMAIL_PASSWORD` - Email account password (✅ configured)

### AI Services (Choose one or more)
- `HUGGINGFACE_API_TOKEN` - **✅ ACTIVE** Hugging Face Pro account for AI features
- `ANTHROPIC_API_KEY` - Claude AI service (fallback)
- `OPENAI_API_KEY` - OpenAI GPT models (fallback)
- `GEMINI_API_KEY` - Google Gemini models (fallback)

### Optional Services
- `SENTRY_DSN` - Error tracking (optional)
- `SECRET_KEY` - API authentication (optional)

## Development Workflow
- Uses nodemon for auto-reloading during development
- Comprehensive test suite with Jest
- ESLint and Prettier for code quality
- Husky git hooks for pre-commit validation