import 'dotenv/config'

type AppConfig = {
  port: number
  nodeEnv: string
  corsOrigin: string | string[]
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
  maxQuestionnaireLength: number
  maxAnswerLength: number
}

type DatabaseConfig = {
  uri: string
  name: string
}

type Config = {
  app: AppConfig
  database: DatabaseConfig
}

function parseOrigins(origins: string | undefined): string | string[] {
  if (!origins || origins === '*') {
    return '*'
  }

  if (origins.includes(',')) {
    return origins.split(',').map(origin => origin.trim()).filter(Boolean)
  }

  return origins
}

const config: Config = {
  app: {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    corsOrigin: parseOrigins(process.env.CORS_ORIGIN ?? 'http://localhost:5173'),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
    maxQuestionnaireLength: Number(process.env.MAX_QUESTIONNAIRE_LENGTH ?? 50),
    maxAnswerLength: Number(process.env.MAX_ANSWER_LENGTH ?? 1000),
  },
  database: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/easyform',
    name: process.env.MONGODB_DATABASE ?? 'easyform',
  },
}

export default config
