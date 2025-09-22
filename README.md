# EasyForm Express on Vercel

This project mirrors the official [Vercel Express example](https://github.com/vercel/examples/tree/main/solutions/express) to provide a lightweight backend scaffold for EasyForm deployments.

## Getting Started

```bash
npm install
npm run dev
```

## Available Routes

- `/` – HTML landing page with navigation
- `/about` – Static HTML page served from `components/about.htm`
- `/api-data` – Example JSON payload
- `/healthz` – Health check returning status and timestamp

## Deployment

Use `vercel` to build and deploy. The `vercel.json` file points all incoming traffic to the Express app running in `api/index.ts` on the Node.js 20 runtime.
