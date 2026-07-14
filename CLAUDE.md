# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Phases 0–4 of `plan.md` / `TASKS.md` are built and validated end-to-end (auth, multi-tenancy, property/unit/lease/tenant management, Stripe subscription billing, rent payments, and the renter portal). Phase 5 (email, analytics, maintenance requests, Staff roles, hardening) is optional polish, not started. See `TASKS.md` for the per-phase checklist and `plan.md` for the full architecture/data model.

Stripe Connect (owner payouts) is code-complete but not yet live-verified — it depends on Connect being enabled on the Stripe test account, which was still propagating as of the last session.

## Commands

Run from the repo root (`concurrently` runs both dev servers):

```bash
npm install          # root, installs concurrently only
npm --prefix backend install
npm --prefix frontend install
npm run dev           # both apps, backend on :4000, frontend on :3000
```

Per-app:

```bash
# backend/
npm run dev            # tsx watch src/server.ts
npm run build           # tsc -> dist/
npm run lint             # eslint .
npx tsc --noEmit          # typecheck only

# frontend/
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

Seed scripts (backend/):

```bash
npm run seed:admin -- --email=admin@example.com --password=yourpassword   # creates a super_admin user
npm run seed:plans                                                          # creates Stripe Products/Prices + Plan docs (Starter/Pro/Enterprise)
```

Webhook testing locally (Stripe CLI):

```bash
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe --api-key <STRIPE_SECRET_KEY>
```
Copy the `whsec_...` it prints into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

No automated test suite exists yet — verification so far has been done via ad hoc scripts against the live dev database (created and deleted per test run, not checked in).

## Architecture

**Monorepo, two independently run apps** — `backend/` (Express + TypeScript + native `mongodb` driver) and `frontend/` (Next.js App Router + TypeScript + Tailwind). No shared package; types are duplicated where needed (e.g. `frontend/src/types/models.ts` mirrors `backend/src/models/*.ts`).

**Backend request flow**: `src/routes/index.ts` mounts one router per resource under `/api/v1`. Self-service routes (`/owners/me`, `/tenants/me`, `/payments/me`) are mounted *before* their generic `/:id`-based counterparts so Express doesn't swallow `me` as an id param — follow this pattern for any new self-service route. Middleware chain for owner-scoped routes: `authenticate` → `requireRole(...)` → `scopeToOwner` (sets `req.ownerId` from the JWT, never from client input) → optionally `requireActiveSubscription` / `enforcePlanLimits` on create routes. A central `errorHandler` (`src/middleware/errorHandler.ts`) translates `AppError` subclasses and `Stripe.errors.StripeError` into consistent JSON error responses.

**Data access**: no ODM. `src/models/*.ts` are plain TypeScript interfaces; `src/db/collections.ts` has one typed getter per collection (`getPropertiesCollection()` etc.); indexes are created idempotently in `src/db/connection.ts#createIndexes` on boot. When adding a collection, add it in all three places.

**Stripe webhooks**: `src/webhooks/stripe.webhook.ts`, mounted in `app.ts` with `express.raw()` *before* the global `express.json()` — this ordering is load-bearing, don't move `express.json()` above it. Idempotency via the `webhookEvents` collection (keyed on `stripeEventId`).

**Frontend auth**: `src/lib/auth-context.tsx` holds the access token in memory (not localStorage) and refreshes it via an httpOnly cookie on 401 (see `src/lib/api.ts`'s response interceptor). `src/components/auth/RoleGuard.tsx` wraps each of the three role-scoped layouts (`app/admin`, `app/dashboard`, `app/portal`) and redirects on role mismatch.

**React Compiler eslint rules**: this repo runs the newer React Compiler lint rules (`react-hooks/set-state-in-effect`, `react-hooks/immutability`). Two patterns intentionally suppress them with a comment rather than restructure the code — fetch-on-mount-then-setState (completely standard, not an actual cascading-render bug) and `window.location.href = ...` full-page redirects to Stripe-hosted pages (not a React state mutation). Follow the existing suppression comments as the template if you hit these again; don't silently disable the rule file-wide.

## Fixed constraints (do not deviate without asking the user)

- Native MongoDB driver only — no Mongoose/ODM.
- MongoDB Atlas hosts the database only; connection string lives in `backend/.env` (gitignored, never print its contents back to the user).
- Multi-tenancy: every owner-scoped query must be filtered by `req.ownerId` from the JWT, never a client-supplied value.
- Payments: Stripe only, webhooks are the source of truth for status changes (never trust a client-side success redirect).
- Stripe Connect: use the classic v1 Connect API (`stripe.accounts.create({ type: 'express' })` + Account Links) — the newer Accounts v2 API was evaluated and rejected because it isn't enabled on this Stripe sandbox; don't re-attempt v2 without checking with the user first.
- Frontend deploys to Vercel; backend hosting is intentionally left open.

See `plan.md` for the full data model, API surface, and phased roadmap; `TASKS.md` for the granular per-phase checklist.
