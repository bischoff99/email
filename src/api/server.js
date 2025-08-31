const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const emailRoutes = require("./routes/email");
const automationRoutes = require("./routes/automation");
const Sentry = require("@sentry/node");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/emails", emailRoutes);
app.use("/api/automation", automationRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Test Sentry endpoint
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// Sentry error handler must be registered after all controllers and before any other error middleware
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

module.exports = app;
