const express = require('express');
const asyncHandler = require('../middlewares/async-handler');
const { connectToDatabase, mongoose } = require('../lib/database');
const { HttpError } = require('../lib/errors');

const router = express.Router();

const getConnectionState = () => {
  const state = mongoose.connection.readyState;
  return {
    isConnected: state === 1,
    state,
  };
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      await connectToDatabase();
    } catch (error) {
      console.error('Database connection check failed:', error);
    }

    const { isConnected } = getConnectionState();

    res.json({
      status: isConnected ? 'ok' : 'error',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  })
);

router.get(
  '/ready',
  asyncHandler(async (req, res) => {
    try {
      await connectToDatabase();
    } catch (error) {
      console.error('Database readiness check failed:', error);
    }

    const { isConnected } = getConnectionState();

    if (!isConnected) {
      throw new HttpError(503, 'Database not connected');
    }

    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  })
);

router.get('/live', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
