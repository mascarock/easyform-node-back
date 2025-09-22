const { connectToDatabase } = require('../lib/database');

async function ensureDatabase(req, res, next) {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = ensureDatabase;
