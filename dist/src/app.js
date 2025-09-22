import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import formsRouter from './routes/forms.js';
import draftsRouter from './routes/drafts.js';
import healthRouter from './routes/health.js';
import { ensureDatabase } from './middlewares/ensureDatabase.js';
import { errorHandler } from './middlewares/errorHandler.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function createApp() {
    const app = express();
    app.set('trust proxy', 1);
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    app.use(compression());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    const corsOptions = Array.isArray(config.app.corsOrigin) || config.app.corsOrigin === '*'
        ? {
            origin: config.app.corsOrigin === '*' ? true : config.app.corsOrigin,
            credentials: config.app.corsOrigin === '*' ? false : true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }
        : {
            origin: config.app.corsOrigin,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        };
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
    if (config.app.nodeEnv !== 'test') {
        app.use(morgan('combined'));
    }
    const limiter = rateLimit({
        windowMs: config.app.rateLimitWindowMs,
        limit: config.app.rateLimitMaxRequests,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.get('/', (req, res) => {
        res.json({
            message: 'EasyForm API (Express) running. Try /api/v1/health for status.',
        });
    });
    const publicDir = path.join(__dirname, '..', 'public');
    app.use('/public', express.static(publicDir));
    app.use('/api/v1/health', healthRouter);
    app.use('/api/v1/forms/draft', limiter, ensureDatabase, draftsRouter);
    app.use('/api/v1/forms', limiter, ensureDatabase, formsRouter);
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found',
        });
    });
    app.use(errorHandler);
    return app;
}
