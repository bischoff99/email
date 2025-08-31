const HostingerEmailClient = require('../../src/core/emailClient');

describe('HostingerEmailClient', () => {
  let emailClient;

  beforeEach(() => {
    emailClient = new HostingerEmailClient({
      host: 'mail.hostinger.com',
      port: 993,
      tls: true,
      user: 'test@example.com',
      password: 'testpassword'
    });
  });

  test('should extract verification links from email content', () => {
    const emailContent = {
      html: '<a href="https://example.com/verify?token=abc123">Verify Email</a>'
    };

    const links = emailClient.extractVerificationLinks(emailContent);
    expect(links).toContain('https://example.com/verify?token=abc123');
  });

  test('should extract verification code from email content', () => {
    const emailContent = {
      text: 'Your verification code is: ABC123'
    };

    const code = emailClient.extractVerificationCode(emailContent);
    expect(code).toBe('ABC123');
  });

  test('should handle email content without verification links', () => {
    const emailContent = {
      text: 'This is a regular email without verification links'
    };

    const links = emailClient.extractVerificationLinks(emailContent);
    expect(links).toEqual([]);
  });

  test('should handle email content without verification codes', () => {
    const emailContent = {
      text: 'This is a regular email without verification codes'
    };

    const code = emailClient.extractVerificationCode(emailContent);
    expect(code).toBeNull();
  });
});

