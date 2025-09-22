# EasyForm Express API

Lightweight Express backend that mirrors the EasyForm NestJS service. It exposes form submission, draft management, and health endpoints while remaining friendly to Vercel serverless deployments.

## Local Development

```bash
npm install
cp .env.example .env # adjust MongoDB and CORS values as needed
npm run dev
```

The `dev` script uses [`tsx`](https://github.com/esbuild-kit/tsx) for on-the-fly TypeScript compilation. For a production-style run:

```bash
npm start
```

This compiles TypeScript and launches the emitted `dist/src/index.js`, copying any static assets into `dist` during the build step.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | Local listen port when running `npm start` |
| `MONGODB_URI` | `mongodb://localhost:27017/easyform` | Connection string for MongoDB |
| `MONGODB_DATABASE` | `easyform` | Database name |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin(s); comma-separated list for multiple values or `*` |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate-limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Requests allowed per window |
| `MAX_QUESTIONNAIRE_LENGTH` | `50` | Maximum number of questions per submission |
| `MAX_ANSWER_LENGTH` | `1000` | Maximum characters per text answer |

## API Overview

All endpoints are prefixed with `/api/v1`.

### Forms

- `POST /forms/submit` – Validate, sanitize, and persist a submission. Accepts optional `sessionId` for draft conversion. Returns submission id on success.
- `GET /forms/submissions` – Paginated submissions (`formId`, `userEmail`, `limit`, `offset`).
- `GET /forms/submissions/:id` – Fetch a single submission by id.
- `GET /forms/statistics` – Aggregate totals and per-day counts, filterable by `formId`.

### Drafts

- `POST /forms/draft/save` – Upsert a draft with 7-day expiry and request metadata tracking.
- `GET /forms/draft/:sessionId` – Retrieve an active draft (returns empty payload when none exist).
- `DELETE /forms/draft/:sessionId` – Remove a stored draft.
- `GET /forms/draft` – Summary statistics for active drafts; accepts `formId`.
- `GET /forms/draft/admin/cleanup` – Remove expired drafts.

### Health

- `GET /health` – Basic health payload with database connectivity status.
- `GET /health/ready` – Returns `503` if MongoDB is disconnected.
- `GET /health/live` – Lightweight liveness endpoint.

## Deployment

`vercel build` and `vercel deploy` automatically target `api/index.ts`, which exports the Express app. The database connection is lazily established per request through middleware, keeping cold starts fast on serverless platforms.
