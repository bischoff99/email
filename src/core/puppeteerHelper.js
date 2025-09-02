const puppeteer = require('puppeteer');

class PuppeteerHelper {
  constructor(config) {
    this.config = config;
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
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
