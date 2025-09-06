# Email Integration Server - Replit Setup

## Overview
This is a Node.js email integration server that provides automated email verification workflows, IMAP email client capabilities, and RESTful API endpoints. The server has been configured for optimal performance on Replit.

## Current State
- **Status**: ✅ FULLY OPERATIONAL - All systems working
- **Port**: 5000 (optimized for Replit webview)
- **Public URL**: https://workspace.nojus9.repl.co
- **Environment**: Development (ready for production deployment)
- **Email Integration**: ✅ Connected to imap.hostinger.com
- **AI Service**: ✅ Hugging Face Pro active with 8 features

## Recent Changes (September 6, 2025)
- **✅ COMPLETED EMAIL INTEGRATION** - Full Hostinger IMAP connectivity working
- **✅ EMAIL AUTHENTICATION** - Resolved credential issues and server configuration
- **✅ OPTIMIZED FOR REPLIT** - Server now runs on port 5000 for proper webview display
- **✅ BEAUTIFUL WEB INTERFACE** - Professional dashboard with gradient design
- **✅ AI SERVICE ACTIVE** - Hugging Face Pro integration with 8 AI features
- **✅ COMPREHENSIVE TESTING** - All functionality verified and working
- **✅ PRODUCTION READY** - Complete email automation server operational
- Fixed email server hostname configuration (imap.hostinger.com)
- Added proper secret management for EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD
- Enhanced health monitoring with real-time connection testing
- Implemented fallback AI analysis for improved reliability

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

### **✅ FULLY WORKING** AI-Powered Email Processing
- `GET /api/ai/status` - AI service status and capabilities ✅
- `POST /api/ai/analyze-email` - Comprehensive email analysis ✅
- `POST /api/ai/generate-response` - AI-generated professional responses ✅
- `POST /api/ai/categorize-emails` - Batch email categorization ✅
- `POST /api/ai/extract-actions` - Extract action items and deadlines ✅
- `POST /api/ai/summarize-thread` - Summarize email conversations ✅
- `POST /api/ai/smart-process` - Combined analysis and response generation ✅

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
### ✅ Email Integration (FULLY CONFIGURED)
- `EMAIL_HOST` - IMAP server hostname (✅ configured: imap.hostinger.com)
- `EMAIL_USER` - Email account username (✅ configured: nojus@thrivzly.com)
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