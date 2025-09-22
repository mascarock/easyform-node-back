const { createApp } = require('./app');
const config = require('./config');
const { connectToDatabase } = require('./lib/database');

async function start() {
  try {
    await connectToDatabase();

    const app = createApp();
    const port = config.app.port;

    app.listen(port, () => {
      console.log(`🚀 EasyForm backend running on http://localhost:${port}`);
      console.log(`📊 Health check at http://localhost:${port}/api/v1/health`);
      console.log(`📝 Form submission endpoint at http://localhost:${port}/api/v1/forms/submit`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { start };
