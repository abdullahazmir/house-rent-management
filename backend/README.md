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
