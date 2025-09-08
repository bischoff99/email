// Test setup file
// Set environment variables for testing

// Enable authentication in tests
process.env.NODE_ENV = 'test';

// Set up API keys for testing
process.env.API_KEYS = 'test-api-key,another-test-key';

// Mock email configuration to avoid missing env vars errors
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASSWORD = 'test-password';

// Disable external APIs for testing
process.env.HUGGINGFACE_API_TOKEN = '';
process.env.OPENAI_API_KEY = '';

// Extend Jest matchers
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false
      };
    }
  }
});