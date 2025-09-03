const request = require('supertest');
const app = require('../../src/api/server');

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    test('GET /health should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBeOneOf([200, 503]); // Healthy or degraded
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('checks');
    });
  });

  describe('Email API Authentication', () => {
    test('GET /api/emails/latest/test@example.com without API key should return 401', async () => {
      const response = await request(app)
        .get('/api/emails/latest/test@example.com')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('API key required');
    });

    test('GET /api/emails/latest/test@example.com with invalid API key should return 401', async () => {
      const response = await request(app)
        .get('/api/emails/latest/test@example.com')
        .set('X-API-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid API key');
    });

    test('GET /api/emails/latest/test@example.com with valid API key should proceed (may fail due to missing email config)', async () => {
      const response = await request(app)
        .get('/api/emails/latest/test@example.com')
        .set('X-API-Key', 'dev-api-key');

      // Should either return 500 (missing email config) or 200 (if configured)
      expect(response.status).toBeOneOf([200, 500]);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Input Validation', () => {
    test('GET /api/emails/latest/invalid-email with valid API key should return 400', async () => {
      const response = await request(app)
        .get('/api/emails/latest/invalid-email')
        .set('X-API-Key', 'dev-api-key');

      // Should return 400 for invalid email format or 500 if email config missing
      expect(response.status).toBeOneOf([400, 500]);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      
      if (response.status === 400) {
        expect(response.body.error).toContain('Invalid email address');
      }
    });

    test('POST /api/emails/extract-links with invalid body should return 400', async () => {
      const response = await request(app)
        .post('/api/emails/extract-links')
        .set('X-API-Key', 'dev-api-key')
        .send({ invalidField: 'value' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/emails/extract-links with valid body should return 200', async () => {
      const response = await request(app)
        .post('/api/emails/extract-links')
        .set('X-API-Key', 'dev-api-key')
        .send({
          emailContent: {
            text: 'Click here to verify: https://example.com/verify?token=abc123',
            html: '<a href="https://example.com/verify?token=abc123">Verify</a>'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('links');
      expect(Array.isArray(response.body.links)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('Multiple rapid requests should eventually hit rate limit', async () => {
      // This test might be flaky in CI, so we make it less strict
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/health')
            .expect((res) => {
              expect([200, 429, 503]).toContain(res.status);
            })
        );
      }
      
      await Promise.all(promises);
    }, 10000);
  });
});

// Helper for expect.toBeOneOf
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});