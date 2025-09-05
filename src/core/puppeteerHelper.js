const puppeteer = require('puppeteer');

class PuppeteerHelper {
  constructor(config) {
    this.config = config;
    this.browser = null;
  }

  async initialize() {
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--no-zygote',
      '--disable-dev-shm-usage',
      '--disable-web-security',
    ];
    
    const launchOptions = {
      headless: this.config.headless,
      args: launchArgs,
    };
    
    // Use custom executable path if provided (for Replit)
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    
    this.browser = await puppeteer.launch(launchOptions);
  }

  async navigateToVerification(verificationLink) {
    const page = await this.browser.newPage();
    await page.goto(verificationLink, { waitUntil: 'networkidle2' });
    return page;
  }

  async fillVerificationCode(page, code) {
    await page.waitForSelector('#verification-code');
    await page.type('#verification-code', code);
    await page.click('#verify-button');
  }

  async waitForVerificationComplete(page) {
    await page.waitForSelector('.verification-success', { timeout: 10000 });
    return await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      return document.querySelector('.verification-success').textContent;
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = PuppeteerHelper;
