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


