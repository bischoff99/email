const express = require('express');
const EmailVerificationWorkflow = require('../../automation/emailVerification');
const config = require('../../core/config');
const { apiKeyAuth, validateEmailInput } = require('../../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(apiKeyAuth);

// Validation middleware
const validateConfig = (req, res, next) => {
  if (!config.email.user || !config.email.password) {
    return res.status(500).json({
      success: false,
      error:
        'Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.',
    });
  }
  next();
};

// Execute verification workflow
router.post('/verify-email', validateConfig, async (req, res) => {
  try {
    const { senderEmail, maxWaitTime = 60000 } = req.body;

    // Validate input
    if (!senderEmail || !senderEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sender email address',
      });
    }

    if (maxWaitTime < 5000 || maxWaitTime > 300000) {
      return res.status(400).json({
        success: false,
        error: 'Max wait time must be between 5 seconds and 5 minutes',
      });
    }

    const workflow = new EmailVerificationWorkflow(config.email, config.puppeteer);

    const result = await workflow.executeVerificationWorkflow(senderEmail, maxWaitTime);

    res.json({
      success: true,
      result,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Verification workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date(),
    });
  }
});

module.exports = router;
