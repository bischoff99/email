const express = require('express');
const EmailVerificationWorkflow = require('../../automation/emailVerification');
const config = require('../../core/config');

const router = express.Router();

// Execute verification workflow
router.post('/verify-email', async (req, res) => {
  try {
    const { senderEmail, maxWaitTime } = req.body;
    
    const workflow = new EmailVerificationWorkflow(
      config.email, 
      config.puppeteer
    );
    
    const result = await workflow.executeVerificationWorkflow(
      senderEmail, 
      maxWaitTime
    );
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;


