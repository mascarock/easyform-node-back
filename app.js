const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const formsRouter = require('./routes/forms');
const draftsRouter = require('./routes/drafts');
const healthRouter = require('./routes/health');
const ensureDatabase = require('./middlewares/ensure-database');
const errorHandler = require('./middlewares/error-handler');

function createCorsOptions() {
  const origins = config.app.corsOrigin;

  if (origins === '*') {
    return {
      origin: true,
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    };
  }

  return {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
}

function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  const corsOptions = createCorsOptions();
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  if (config.app.nodeEnv !== 'test') {
    app.use(morgan('combined'));
  }

  app.get('/', (req, res) => {
    res.json({
      message: 'EasyForm API (Express) running. Try /api/v1/health for status.',
    });
  });

  app.get('/api/v1/docs', (req, res) => {
    res.json({
      message: 'Swagger UI is not available in the lightweight build. Please refer to repository documentation.',
    });
  });

  const limiter = rateLimit({
    windowMs: config.app.rateLimitWindowMs,
    limit: config.app.rateLimitMaxRequests,
    legacyHeaders: false,
    standardHeaders: true,
  });

  app.use('/api/v1/health', healthRouter);

  app.use('/api/v1/forms/draft', limiter, ensureDatabase, draftsRouter);
  app.use('/api/v1/forms', limiter, ensureDatabase, formsRouter);

  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
