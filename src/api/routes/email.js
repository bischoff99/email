const express = require('express');
const HostingerEmailClient = require('../../core/emailClient');
const config = require('../../core/config');
const { apiKeyAuth, validateEmailInput } = require('../../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(apiKeyAuth);

// Validation middleware
const validateEmailConfig = (req, res, next) => {
  if (!config.email.user || !config.email.password) {
    return res.status(500).json({
      success: false,
      error:
        'Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.',
    });
  }
  next();
};

// Get latest emails from sender
router.get('/latest/:sender', validateEmailConfig, validateEmailInput, async (req, res) => {
  let emailClient;
  try {
    const { sender } = req.params;
    const limit = parseInt(req.query.limit) || 1;

    // Validate input
    if (!sender || !sender.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sender email address',
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
      });
    }

    emailClient = new HostingerEmailClient(config.email);
    await emailClient.connect();
    const emails = await emailClient.getLatestFromSender(sender, limit);

    res.json({ success: true, emails, count: emails.length });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date(),
    });
  } finally {
    if (emailClient) {
      emailClient.disconnect();
    }
  }
});

// Search emails by criteria
router.post('/search', validateEmailConfig, async (req, res) => {
  let emailClient;
  try {
    const { criteria, options } = req.body;

    // Validate input
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search criteria',
      });
    }

    emailClient = new HostingerEmailClient(config.email);
    await emailClient.connect();
    const emails = await emailClient.searchEmails(criteria, options || {});

    res.json({ success: true, emails, count: emails.length });
  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date(),
    });
  } finally {
    if (emailClient) {
      emailClient.disconnect();
    }
  }
});

// Extract verification links
router.post('/extract-links', async (req, res) => {
  try {
    const { emailContent } = req.body;

    // Validate input
    if (!emailContent || typeof emailContent !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid email content. Expected object with text or html property.',
      });
    }

    const emailClient = new HostingerEmailClient(config.email);
    const links = emailClient.extractVerificationLinks(emailContent);

    res.json({ success: true, links, count: links.length });
  } catch (error) {
    console.error('Error extracting links:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date(),
    });
  }
});

module.exports = router;
