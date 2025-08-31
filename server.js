require("./instrument.js");

const app = require('./src/api/server');
const config = require('./src/core/config');

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`Email Integration Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Email API: http://localhost:${PORT}/api/emails`);
  console.log(`Automation API: http://localhost:${PORT}/api/automation`);
});

