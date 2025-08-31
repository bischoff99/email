const HostingerEmailClient = require('../core/emailClient');
const PuppeteerHelper = require('../core/puppeteerHelper');

class EmailVerificationWorkflow {
  constructor(emailConfig, puppeteerConfig) {
    this.emailClient = new HostingerEmailClient(emailConfig);
    this.puppeteerHelper = new PuppeteerHelper(puppeteerConfig);
  }

  async executeVerificationWorkflow(senderEmail, maxWaitTime = 60000) {
    try {
      // 1. Connect to email
      await this.emailClient.connect();

      // 2. Wait for verification email
      const email = await this.waitForVerificationEmail(senderEmail, maxWaitTime);

      // 3. Extract verification link
      const links = this.emailClient.extractVerificationLinks(email);
      if (links.length === 0) {
        throw new Error('No verification links found');
      }

      // 4. Initialize Puppeteer
      await this.puppeteerHelper.initialize();

      // 5. Navigate to verification link
      const page = await this.puppeteerHelper.navigateToVerification(links[0]);

      // 6. Complete verification
      const result = await this.puppeteerHelper.waitForVerificationComplete(page);

      return { success: true, result };

    } catch (error) {
      throw new Error(`Verification workflow failed: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }

  async waitForVerificationEmail(senderEmail, maxWaitTime) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const emails = await this.emailClient.getLatestFromSender(senderEmail, 1);
      
      if (emails.length > 0) {
        const emailAge = Date.now() - new Date(emails[0].date).getTime();
        if (emailAge < 300000) { // 5 minutes
          return emails[0];
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Verification email not received within timeout');
  }

  async cleanup() {
    if (this.puppeteerHelper.browser) {
      await this.puppeteerHelper.close();
    }
    this.emailClient.disconnect();
  }
}

module.exports = EmailVerificationWorkflow;


