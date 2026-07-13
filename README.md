# House Rent Management

A multi-tenant SaaS for property owners to manage properties, units, leases, and tenants, with Stripe-powered subscription billing and rent collection.

See `plan.md` for the full architecture, data model, and API surface, and `TASKS.md` for the phased implementation checklist.

## Monorepo layout

```
backend/    Express + TypeScript REST API (MongoDB Atlas via the native driver)
frontend/   Next.js + TypeScript app (Tailwind)
```

Each app is deployed and run independently; this repo just keeps them in one place for atomic commits.

## Development

```bash
npm install
npm run dev
```

`npm run dev` runs the backend and frontend dev servers concurrently. Each app also has its own `npm run dev` if you want to run just one (see `backend/README.md` and `frontend/README.md` once scaffolded).

## Environment variables

Each app has its own `.env.example` (`backend/.env.example`, `frontend/.env.local.example`). Copy them and fill in real values before running.
