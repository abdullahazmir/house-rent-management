# House Rent Management — Backend

Express + TypeScript REST API using the official native MongoDB Node.js driver (no Mongoose/ODM). See `../plan.md` for the full architecture and `../CLAUDE.md` for the fixed constraints this backend must follow.

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

The dev server runs on `http://localhost:4000` by default (override with `PORT`). Fill in `.env` with your MongoDB Atlas connection string, JWT secrets, and Stripe keys before wiring up features that need them (not required just to boot the scaffold).

Verify it's up:

```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

## Scripts

- `npm run dev` — start the API with hot reload (`tsx watch`)
- `npm run build` — type-check and compile to `dist/`
- `npm start` — run the compiled output from `dist/`
- `npm run lint` — run ESLint
- `npm run seed:admin -- --email=admin@example.com --password=yourpassword` — creates a `super_admin` user
- `npm run seed:plans` — creates the Stripe Products/Prices + `Plan` docs (Starter/Pro/Enterprise)
- `npm run seed:demo` — creates a demo owner (with sample properties/publicly-listed units) and a demo `super_admin`, for the frontend's "Demo login" button and for manual admin testing. Idempotent — safe to re-run.

### Demo credentials (after `npm run seed:demo`)

| Role  | Email                       | Password         |
|-------|------------------------------|------------------|
| Owner | `demo.owner@houserent.dev`  | `DemoOwner123!`  |
| Admin | `demo.admin@houserent.dev`  | `DemoAdmin123!`  |

The `/login` page's "Demo login" button signs in as the demo owner automatically. Log in as the demo admin manually at `/login`, then visit `/admin`.

## Deploying (Render)

`CLIENT_APP_URL` (used for both CORS and Stripe redirect URLs) is read once into `env` at
process boot (`src/config/env.ts`) — **changing it in the Render dashboard's Environment tab
does not take effect until the service actually restarts.** Saving the env var alone doesn't
always trigger a restart depending on plan/settings; after changing it, explicitly use
**Manual Deploy → Deploy latest commit** (or **Restart Service**) and wait for the deploy to
show **Live** before assuming it's applied. Verify with:

```bash
curl -i -H "Origin: https://<your-frontend-domain>" https://<your-backend>.onrender.com/api/v1/public/units
# look for: access-control-allow-origin: https://<your-frontend-domain>
```

If that header still shows a stale origin after a deploy, the deploy likely hasn't actually
restarted the process yet, or `CLIENT_APP_URL` doesn't exactly match the frontend's origin
(no trailing slash, no path).

## Project layout

```
src/
├── config/       # env/config loading
├── db/           # MongoClient singleton + typed collection getters
├── models/       # plain TS interfaces (document shapes, no ODM schemas)
├── controllers/  # request handlers
├── routes/       # Express routers
├── middleware/   # auth, owner-scoping, error handling, etc.
├── services/     # business logic (Stripe, etc.)
├── validators/   # zod schemas
├── utils/        # jwt, password hashing, helpers
├── webhooks/     # Stripe webhook handlers
├── app.ts        # Express app (middleware, routes)
└── server.ts     # entrypoint (env loading, app.listen)
```
