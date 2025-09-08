const express = require('express');
const HostingerEmailClient = require('../../core/emailClient');
const config = require('../../core/config');
const { apiKeyAuth, validateEmailInput } = require('../../middleware/auth');

const router = express.Router();

// Apply authentication to all routes (always, except in development without explicit test mode)
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || process.env.ENABLE_AUTH === 'true') {
  router.use(apiKeyAuth);
}

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

// Get all emails with pagination (inbox view)
router.get('/inbox', validateEmailConfig, async (req, res) => {
  let emailClient;
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Validate input
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
      });
    }

    if (offset < 0) {
      return res.status(400).json({
        success: false,
        error: 'Offset must be 0 or greater',
      });
    }

    emailClient = new HostingerEmailClient(config.email);
    await emailClient.connect();
    const result = await emailClient.getAllEmails(limit, offset);

    res.json({ 
      success: true, 
      ...result
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
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

// Get specific email by ID
router.get('/email/:messageId', validateEmailConfig, async (req, res) => {
  let emailClient;
  try {
    const { messageId } = req.params;

    // Validate input
    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required',
      });
    }

    emailClient = new HostingerEmailClient(config.email);
    await emailClient.connect();
    const email = await emailClient.getEmailById(messageId);

    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found',
      });
    }

    res.json({ success: true, email });
  } catch (error) {
    console.error('Error fetching email:', error);
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
    const { criteria, options, sender, subject, limit } = req.body;

    // Build search criteria from user-friendly format or use raw criteria
    let searchCriteria;
    if (criteria && Array.isArray(criteria)) {
      // Use raw criteria format
      searchCriteria = criteria;
    } else {
      // Build criteria from individual fields
      searchCriteria = [];
      if (sender && sender.trim()) {
        searchCriteria.push('FROM', sender.trim());
      }
      if (subject && subject.trim()) {
        searchCriteria.push('SUBJECT', subject.trim());
      }
    }

    // Validate that we have some criteria
    if (!searchCriteria || searchCriteria.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide search criteria (sender, subject, or raw criteria array)',
      });
    }

    const searchOptions = {
      limit: limit || (options && options.limit) || 10,
      ...options,
    };

    emailClient = new HostingerEmailClient(config.email);
    await emailClient.connect();
    const emails = await emailClient.searchEmails(searchCriteria, searchOptions);

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
    if (!emailContent) {
      return res.status(400).json({
        success: false,
        error: 'Email content is required.',
      });
    }

    // Convert string content to object format if needed
    let processedContent;
    if (typeof emailContent === 'string') {
      processedContent = { text: emailContent };
    } else if (typeof emailContent === 'object') {
      processedContent = emailContent;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid email content format.',
      });
    }

    const emailClient = new HostingerEmailClient(config.email);
    const links = emailClient.extractVerificationLinks(processedContent);

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
