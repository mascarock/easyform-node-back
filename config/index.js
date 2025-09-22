const parseNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseCorsOrigins = (value) => {
  if (!value) {
    return ['http://localhost:5173'];
  }
  if (value === '*') {
    return '*';
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const config = {
  app: {
    port: parseNumber(process.env.PORT, 3001),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
    rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    rateLimitMaxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    maxQuestionnaireLength: parseNumber(process.env.MAX_QUESTIONNAIRE_LENGTH, 50),
    maxAnswerLength: parseNumber(process.env.MAX_ANSWER_LENGTH, 1000),
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/easyform',
    name: process.env.MONGODB_DATABASE || 'easyform',
  },
};

module.exports = config;
