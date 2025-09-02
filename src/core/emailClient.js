const Imap = require('imap');
const { simpleParser } = require('mailparser');

class HostingerEmailClient {
  constructor(config) {
    this.config = {
      host: config.host || 'mail.hostinger.com',
      port: config.port || 993,
      tls: config.tls !== false,
      user: config.user,
      password: config.password,
      ...config,
    };
    this.imap = new Imap(this.config);
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('Connected to email server');
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error('Connection error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  disconnect() {
    this.imap.end();
  }

  searchEmails(criteria, options = {}) {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', true, (err) => {
        if (err) return reject(err);

        this.imap.search(criteria, (err, results) => {
          if (err) return reject(err);

          if (!results || results.length === 0) {
            return resolve([]);
          }

          const limitedResults = options.limit ? results.slice(-options.limit) : results;

          const fetch = this.imap.fetch(limitedResults, {
            bodies: '',
            struct: true,
          });

          const emails = [];

          fetch.on('message', (msg) => {
            let emailData = {};

            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) return;

                emailData = {
                  messageId: parsed.messageId,
                  subject: parsed.subject,
                  from: parsed.from,
                  to: parsed.to,
                  date: parsed.date,
                  text: parsed.text,
                  html: parsed.html,
                  attachments: parsed.attachments || [],
                };
              });
            });

            msg.once('end', () => {
              emails.push(emailData);
            });
          });

          fetch.once('error', reject);
          fetch.once('end', () => {
            emails.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(emails);
          });
        });
      });
    });
  }

  async getLatestFromSender(senderEmail, limit = 1) {
    const criteria = ['FROM', senderEmail];
    return await this.searchEmails(criteria, { limit });
  }

  async searchBySubject(keyword, limit = 10) {
    const criteria = ['SUBJECT', keyword];
    return await this.searchEmails(criteria, { limit });
  }

  async searchByContent(keyword, limit = 10) {
    const criteria = ['TEXT', keyword];
    return await this.searchEmails(criteria, { limit });
  }

  async searchByDateRange(since, before = null, limit = 10) {
    let criteria = ['SINCE', since];
    if (before) {
      criteria = criteria.concat(['BEFORE', before]);
    }
    return await this.searchEmails(criteria, { limit });
  }

  extractVerificationLinks(emailContent) {
    const linkRegex = /https?:\/\/[^\s<>"]+(?:verify|confirm|activate)[^\s<>"]*/gi;
    const htmlContent = emailContent.html || emailContent.text || '';
    return htmlContent.match(linkRegex) || [];
  }

  extractVerificationCode(emailContent) {
    const codeRegex = /(?:code|token|otp)\s*(?:is)?\s*:?\s*([A-Z0-9]{4,8})/i;
    const content = emailContent.text || emailContent.html || '';
    const match = codeRegex.exec(content);
    return match ? match[1] : null;
  }
}

module.exports = HostingerEmailClient;
