# House Rent Management SaaS — Implementation Plan

## Context

The user wants to build a multi-tenant SaaS "house rent management" platform (Buildium/TenantCloud-style): multiple real estate owners sign up and pay a monthly subscription to use the app; each owner manages their own properties and their own renters/customers within an isolated slice of data. The project directory (`E:\Projects\house-rent-management`) is currently empty (git initialized only), so this is a from-scratch build — no existing code or patterns to match.

Confirmed decisions (fixed constraints, not open for re-debate):
- **Stack**: Next.js + TypeScript + Tailwind (+ optional scoped Bootstrap) frontend; Node.js/Express backend; MongoDB Atlas via the official native MongoDB Node.js driver — **no Mongoose/ODM**. User will supply the Atlas connection URI.
- **Architecture**: two separate apps in one monorepo — Next.js frontend calling a standalone Express REST API. MongoDB Atlas is a cloud-hosted *database only* — it does not run the Express API code; the API still needs its own host (see Deployment note below).
- **Payments**: Stripe for everything — Stripe Billing (owner → platform subscription) and Stripe Connect (renter → owner rent payments, with payouts to the owner).
- **Roles**: Super Admin (platform operator), Real Estate Owner (paying tenant), Staff (owner's employees, phase 2), Renter/Tenant (end customer).
- **MVP scope**: property/unit/lease management, rent collection & payment tracking, and Stripe subscription billing (non-negotiable since it's the core SaaS revenue mechanism). Maintenance tracking, notifications, and reports are phase 2.

Outcome of this plan: a saved `plan.md` in the project root that scopes data model, auth, API, frontend structure, billing/payment flows, and a phased roadmap — used to guide actual implementation in follow-up sessions.

## Repository Layout (Monorepo)

```
house-rent-management/
├── backend/          # Express + MongoDB Atlas REST API (native driver, no ODM)
│   ├── src/{config,db,models,controllers,routes,middleware,services,validators,utils,webhooks}
│   ├── src/db/connection.ts      # MongoClient singleton, connects using user-supplied MONGODB_URI
│   ├── src/db/collections.ts     # typed collection getters (db.collection<T>('users'), etc.)
│   ├── src/models/*.ts            # plain TypeScript interfaces (document shapes), no schema behavior
│   ├── src/app.ts, src/server.ts
│   ├── tests/
│   └── .env.example
├── frontend/         # Next.js (App Router, TS)
│   ├── src/app/{(marketing),(auth),admin,dashboard,portal}
│   ├── src/components/{ui, legacy-bootstrap}
│   ├── src/lib, src/hooks, src/types, src/styles
│   └── .env.local.example
├── docs/
├── .gitignore
└── plan.md
```
Two independently deployable Node processes sharing one repo for atomic commits; a root `concurrently` script runs both in dev.

## Data Model (MongoDB Atlas — native driver, no ODM)

Document shapes are defined as plain TypeScript interfaces in `backend/src/models/*.ts` (no Mongoose schemas, no runtime schema behavior). Validation happens at the API boundary via `zod` (request bodies) rather than at the DB layer; optionally, MongoDB [JSON Schema collection validators](https://www.mongodb.com/docs/manual/core/schema-validation/) can be attached per-collection later for defense-in-depth, but that's not required for MVP. Indexes are created explicitly and idempotently at startup via `collection.createIndexes([...])` in `src/db/connection.ts` (there's no schema-level `index: true` declaration like Mongoose provides, so this must be done by hand).

Multi-tenancy strategy: single database, shared collections, every owner-scoped collection carries an indexed `ownerId` field; every query is filtered by the authenticated user's `ownerId` via middleware (never a client-supplied value). Collection access goes through typed getters in `src/db/collections.ts` (e.g. `getUsersCollection(): Collection<UserDoc>`) so every controller works with a consistently typed `Collection<T>` from the native driver.

- **User** — unified auth collection: `email`, `passwordHash`, `role` (`super_admin|owner|staff|renter`), `ownerId`, `isActive`, timestamps. Role-specific profile docs link back to this.
- **Owner** — the paying tenant/company: `companyName`, contact info, `userId`, `stripeCustomerId`, `stripeConnectAccountId` (+ onboarding/charges/payouts flags), `subscription {planId, stripeSubscriptionId, status, currentPeriodEnd, trialEndsAt, cancelAtPeriodEnd}`, `status (active|suspended)`.
- **Plan** — SaaS tiers: `name`, `stripePriceId`, `stripeProductId`, `price`, `billingInterval`, `limits {maxProperties, maxUnits, maxStaff}`, `features`, `isActive`.
- **Property** — `ownerId`, address fields, `type`, `yearBuilt`, `notes`.
- **Unit** — `ownerId`, `propertyId`, `unitNumber`, beds/baths/sqft, `marketRent`, `status`.
- **Lease** — `ownerId`, `propertyId`, `unitId`, `tenantIds[]`, dates, `rentAmount`, `rentDueDayOfMonth`, late fee config, `securityDeposit`, `status`.
- **Tenant** (renter profile, distinct from `User` credentials) — `ownerId`, `userId`, name/contact, `currentLeaseId`, `status`.
- **Payment** — `ownerId`, `leaseId`, `tenantId`, `amountDue/amountPaid`, `dueDate/paidDate`, `method`, `status`, Stripe ids (`stripePaymentIntentId`, `stripeChargeId`, `stripeApplicationFeeAmount`), `receiptUrl`, `recordedByUserId`, `notes`.
- **SubscriptionInvoice** (optional local mirror of Stripe invoices) — `ownerId`, `stripeInvoiceId`, amounts, `status`, period, `hostedInvoiceUrl`.
- **PlatformSettings** (singleton) — `defaultTrialDays`, `platformApplicationFeePercent`, `supportEmail`, `maintenanceMode`.
- **WebhookEvent** — `stripeEventId` (unique), `type`, `processedAt`, raw `payload` — idempotency/audit log for Stripe webhook retries.

Key indexes: `User.email` unique; `Owner.stripeCustomerId`/`stripeConnectAccountId` unique/sparse; compound `{ownerId:1, ...}` on every owner-scoped collection; `WebhookEvent.stripeEventId` unique.

## Authentication & Authorization

- JWT-based (short-lived access token + httpOnly refresh cookie), `bcrypt` password hashing.
- Middleware chain: `authenticate` → `requireRole(...)` → `scopeToOwner` (injects `req.ownerId` from the token, never trusts client input — this is the single highest-risk piece of code in the app for tenant isolation) → `requireActiveSubscription` (blocks writes when subscription is `past_due`/`canceled`/`unpaid`) → `enforcePlanLimits` (checks counts vs `Plan.limits` on create routes).
- Owner self-registers (creates `User`+`Owner`+Stripe customer). Staff and Renters are created/invited by an Owner and set their password via an accept-invite token flow. Super Admin is seeded via script, not public signup.
- **Stripe Connect onboarding** (owner receiving rent payouts): create an Express connected account, generate an Account Link, redirect owner to Stripe-hosted onboarding; `account.updated` webhook is the source of truth for `chargesEnabled`/`payoutsEnabled` (not the redirect alone). "Pay Rent" UI stays disabled until charges are enabled; manual payment recording always works.

## Frontend Structure

Route groups: `(marketing)` public, `(auth)` login/register/forgot-password, `admin` (Super Admin), `dashboard` (Owner+Staff), `portal` (Renter) — each with its own layout enforcing a role guard and redirecting mismatched roles to their correct home.

**Tailwind + Bootstrap risk (flagged):** running both frameworks globally causes reset conflicts (Tailwind preflight vs Bootstrap Reboot) and specificity fights, plus CSS bloat. Recommendation: Tailwind is the system-wide framework for everything new; if Bootstrap is genuinely needed (e.g. reusing an existing template or a specific component), scope it hard to a `components/legacy-bootstrap/` subtree with its CSS prefixed/scoped (e.g. via `postcss-prefix-selector`) so it never leaks onto the rest of the app. Default assumption for the roadmap below: build Tailwind-only; treat Bootstrap as an opt-in scoped island only if a concrete need shows up.

Shared pieces: `components/ui/` (Tailwind primitives), `lib/api.ts` (typed client, auto token refresh on 401), `lib/auth-context.tsx` (user/role/ownerId context), forms via `react-hook-form` + `zod`.

## Backend API (Express REST, base `/api/v1`)

Route groups: `/auth` (register/login/refresh/me/forgot-reset-password/accept-invite), `/owners` (super_admin management) and `/owners/me` (self-service + Connect onboarding), `/plans`, `/subscriptions` (checkout-session, portal-session, invoices), `/properties`, `/properties/:id/units`, `/leases`, `/tenants`, `/payments` (list/manual/receipt, plus renter `/me` and `/me/checkout-session`), `/admin` (Super Admin stats/settings), `/webhooks/stripe`.

**Stripe webhook handling** is an isolated concern: mounted with `express.raw()` before JSON body parsing, verified via `stripe.webhooks.constructEvent`, idempotent via the `WebhookEvent` collection. Handles subscription lifecycle (`checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`), Connect account sync (`account.updated`), and rent payment events (`payment_intent.succeeded/failed`, `charge.refunded`). Webhooks are the only place that flips paid/subscription-active status — never trust a client-side success redirect alone.

Validation via `zod` schemas per route; a central error handler normalizes `NotFoundError`/`ForbiddenError`/`ValidationError`/`PlanLimitError` to consistent JSON responses.

## Subscription Billing Flow (Owner → Platform)

Register → Stripe Customer created, owner starts `trialing` → owner picks a plan → `POST /subscriptions/checkout-session` (Stripe Checkout, subscription mode) → webhook activates `Owner.subscription` → dashboard unlocked, plan limits enforced on create actions. Upgrade/downgrade/cancel and payment-method updates are handled entirely by Stripe's hosted Billing Portal (`POST /subscriptions/portal-session`) — no custom UI needed. Failed payments set `past_due` via webhook; Stripe Smart Retries handle re-attempts; dashboard shows a restricting banner until resolved via the portal link.

## Rent Payment Flow (Renter → Owner, via Connect)

Owner creates a Lease and invites a Tenant → tenant sets password via invite link → `Payment` docs generated per lease (MVP: generate the next ~12 months upfront on lease activation; a daily job flips `pending`→`late` and computes late fees past the grace period) → renter pays via `POST /payments/me/checkout-session` (PaymentIntent with `transfer_data.destination` = owner's connected account, optional platform `application_fee_amount`, default 0% unless told otherwise) → `payment_intent.succeeded` webhook marks the payment paid → Stripe handles payout to the owner automatically per their Connect payout schedule. Manual cash/check recording (`POST /payments/manual`) must exist in MVP since not all rent flows through Stripe on day one. Receipts: Stripe-hosted URL for online payments; a simple printable HTML receipt page for manual ones.

## Development Roadmap

- **Phase 0 — Scaffolding & Core Auth**: monorepo setup, TS/ESLint/Prettier, Mongo Atlas connection, base Express + Next.js apps, `User`/`Owner` models, register/login/refresh/me, auth+role+owner-scope middleware skeleton, Super Admin seed script, role-guarded route-group shells.
- **Phase 1 — Property/Unit/Lease/Tenant Management**: full CRUD + owner-scoping for `Property`/`Unit`/`Lease`/`Tenant`; owner dashboard UI; tenant invite flow (email can be a stubbed console-logged link initially); Super Admin owners list (view/suspend/activate).
- **Phase 2 — Stripe SaaS Subscription Billing**: `Plan` model + seeded tiers, Stripe Customer/Checkout/Billing Portal endpoints, webhook handlers for subscription lifecycle, `requireActiveSubscription`/`enforcePlanLimits` wired in, pricing page, billing settings page, trial/past-due banners.
- **Phase 3 — Stripe Rent Payments + Connect Payouts**: Connect Express onboarding + `account.updated` sync, `Payment` model + generation logic + late-fee job, renter online payment flow, manual payment recording, owner payments dashboard.
- **Phase 4 — Tenant/Renter Portal**: accept-invite flow, `/portal` lease summary/payment history/pay-now/receipt pages.
- **Phase 5 — Polish (later)**: transactional email, dashboard analytics/MRR, maintenance request tracking, Staff role permission matrix, SMS reminders, PDF receipts, audit logging, rate-limiting hardening.

## Key Packages

**Backend**: `express`, `mongodb` (official native Node.js driver — no `mongoose`), `jsonwebtoken`, `bcrypt`, `stripe`, `cors`, `dotenv`, `zod`, `cookie-parser`, `helmet`, `express-rate-limit`, `node-cron`, `morgan`; dev: `typescript`, `ts-node-dev`/`tsx`, `@types/*`, `eslint`, `prettier`, `jest`+`supertest`.

**Frontend**: `next`, `react`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@stripe/stripe-js`, `date-fns`, an icon set (`lucide-react`); dev: `@types/*`, `eslint-config-next`, `prettier`. Bootstrap/`react-bootstrap`/`postcss-prefix-selector` only if the scoped-island approach above is actually needed.

## Environment & Config

`backend/.env.example`: `NODE_ENV`, `PORT`, `MONGODB_URI` (Atlas connection string, supplied by user), `MONGODB_DB_NAME`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (+ expiry vars), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_APP_URL`, `DEFAULT_TRIAL_DAYS`, `COOKIE_DOMAIN`.
`frontend/.env.local.example`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
Both example files committed; real `.env`/`.env.local` gitignored.

## Cross-Cutting Notes

- **Testing**: since only Atlas is used (no local/in-memory Mongo), API integration tests (Jest/Supertest) run against a dedicated test database on the same Atlas cluster (e.g. `MONGODB_DB_NAME=house_rent_test`), truncating/dropping collections between test runs; prioritize auth and owner-scoping tests (verify no cross-tenant data leakage) and Stripe webhook handlers (mocked SDK).
- **Security**: `helmet`, rate limiting on auth routes, `zod` validation everywhere, never trust client-supplied `ownerId`/`role`, CORS locked to the frontend origin.
- **Deployment**: frontend (Next.js) will deploy to **Vercel**. Backend host is left open for now — build it host-agnostic (12-factor, env-var driven) so it can go to Render/Railway/Fly.io/AWS or Vercel serverless functions later. Note if the backend also ends up on Vercel: serverless functions can handle the Stripe webhook endpoint fine, but `node-cron` won't run reliably in a serverless environment (no long-lived process) — the late-fee/payment-generation scheduled job would need to move to Vercel Cron Jobs (or an external scheduler hitting a protected endpoint) instead. Decide this when ready to deploy; it doesn't block local development.

## Critical Anchor Files (once scaffolding begins)

- `backend/src/db/connection.ts` and `db/collections.ts` — the MongoClient singleton, index creation, and typed collection accessors that replace what Mongoose models would have done.
- `backend/src/models/*.ts` — especially `Owner`, `User`, `Payment`, `Lease` (the multi-tenancy contract lives here).
- `backend/src/middleware/auth.ts` and `scopeToOwner.ts` — the tenant-isolation enforcement point.
- `backend/src/webhooks/stripe.webhook.ts` — source of truth for all payment/subscription state transitions.
- `frontend/src/lib/auth-context.tsx` and `app/admin/layout.tsx` / `app/dashboard/layout.tsx` / `app/portal/layout.tsx` — role-guarded shells.
- `frontend/tailwind.config.ts` and the decision on whether `components/legacy-bootstrap/` exists at all.

## Verification

Since this phase only produces a plan document, verification is: confirm `plan.md` is written to the project root and review it for completeness/accuracy against the decisions above. Actual end-to-end verification (running the app, hitting endpoints, testing Stripe webhooks with the Stripe CLI) applies once implementation begins in a follow-up session.
