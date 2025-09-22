# EasyForm Backend (Express)

Lightweight Express + MongoDB backend for EasyForm. This service exposes the same API surface as the former NestJS backend but is packaged so it can run cleanly as a Vercel serverless function or a traditional Node.js server.

## Features

- Form submission endpoint with validation, sanitisation, and submission protection
- Draft persistence with 7-day TTL and statistics helpers
- Health, readiness, and liveness probes
- Helmet, CORS, compression, and rate limiting baked in
- Shared Express app for local development (`server.js`) and Vercel deployment (`api/index.js`)

## Requirements

- Node.js 18+
- MongoDB instance (local or hosted) accessible via `MONGODB_URI`

## Getting Started

```bash
cd easyform-be-nodejs
npm install
npm run dev
```

The server listens on `http://localhost:3001` by default. Override the port with the `PORT` environment variable.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | Port for local `server.js` |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins or `*` |
| `MONGODB_URI` | `mongodb://localhost:27017/easyform` | MongoDB connection string |
| `MONGODB_DATABASE` | `easyform` | MongoDB database name |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limiter window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Requests allowed per window |
| `MAX_QUESTIONNAIRE_LENGTH` | `50` | Maximum questions per submission |
| `MAX_ANSWER_LENGTH` | `1000` | Maximum characters per text answer |

Create a `.env` file if needed when running locally.

## Deployment on Vercel

- The serverless entry point is `api/index.js`.
- `vercel.json` forces the Node.js 18 runtime.
- All MongoDB connections are cached across invocations to avoid cold-start penalties.

Run `vercel dev` from the repo root (or inside `easyform-be-nodejs`) to test the serverless build locally.

## API Overview

Base URL: `/api/v1`

- `POST /forms/submit`
- `GET /forms/submissions`
- `GET /forms/submissions/:id`
- `GET /forms/statistics`
- `POST /forms/draft/save`
- `GET /forms/draft/:sessionId`
- `DELETE /forms/draft/:sessionId`
- `GET /forms/draft` (statistics)
- `GET /forms/draft/admin/cleanup`
- `GET /health`, `/health/ready`, `/health/live`

Swagger is not bundled in this lightweight build; refer to the repository documentation for schema details.
# easyform-node-back
