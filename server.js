require('./instrument.js');

const Sentry = require('@sentry/node');
const app = require('./src/api/server');
const config = require('./src/core/config');

const logger = app.locals.logger;
const PORT = config.server.port;

const HOST = config.server.host;
const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Email Integration Server running on ${HOST}:${PORT}`);
  
  // Show Replit URL if available
  let publicUrl = `http://${HOST}:${PORT}`;
  if (process.env.REPLIT_URL) {
    publicUrl = process.env.REPLIT_URL;
    logger.info(`🌐 Public URL: ${publicUrl}`);
  } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    publicUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    logger.info(`🌐 Public URL: ${publicUrl}`);
  }
  
  logger.info(`🔍 Health check: ${publicUrl}/health`);
  logger.info(`📧 Email API: ${publicUrl}/api/emails`);
  logger.info(`🤖 Automation API: ${publicUrl}/api/automation`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown', { error: err });
      process.exit(1);
    }

    logger.info('Server closed successfully');

    // Close database connections, clear timers, etc.
    // Add any cleanup logic here

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Force shutdown - server did not close in time');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err });
  Sentry.captureException(err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
  gracefulShutdown('unhandledRejection');
});

