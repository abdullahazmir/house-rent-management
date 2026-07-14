# Execution Task List — House Rent Management SaaS

This breaks `plan.md` into discrete, checkable tasks. Work through a phase top to bottom; tasks in the same **Parallel Group** within a phase have no dependency on each other and can be built/run concurrently (separate terminal sessions, separate branches/worktrees, or separate Claude Code sessions). Tasks outside any group are sequential — do them in order.

## How to use this file

1. Pick the next unchecked task whose `Depends on` tasks are already checked off.
2. Do the work.
3. Run the listed **Validation** step yourself and confirm it passes before checking the box.
4. Check the box (`- [x]`) and move on.

---

## Phase 0 — Scaffolding & Core Auth

| ID | Task | Depends on | Parallel Group |
|----|------|-----------|-----------------|
| P0.1 | Init monorepo: `backend/` + `frontend/` folders, root `package.json` with `concurrently` dev script, `.gitignore`, root `README.md` | — | — |
| P0.2 | Backend scaffold: `npm init`, TypeScript config, ESLint/Prettier, base Express app (`app.ts`/`server.ts`), `helmet`/`cors`/`morgan` wired, `.env.example` | P0.1 | **A** |
| P0.3 | Frontend scaffold: `create-next-app` (TS, App Router), Tailwind configured, ESLint/Prettier, `.env.local.example` | P0.1 | **A** |
| P0.4 | Backend: `src/db/connection.ts` — MongoClient singleton using `MONGODB_URI`/`MONGODB_DB_NAME`, connect-on-boot with a clear error if the URI is missing/unreachable | P0.2 | **B** |
| P0.5 | Backend: `src/models/User.ts` and `src/models/Owner.ts` — plain TS interfaces per `plan.md` | P0.2 | **B** |
| P0.6 | Backend: `src/utils/jwt.ts` (sign/verify access+refresh) and `src/utils/password.ts` (bcrypt hash/compare) | P0.2 | **B** |
| P0.7 | Backend: `src/db/collections.ts` typed getters for `users`/`owners` + `collection.createIndexes()` call on boot (`User.email` unique, `Owner.stripeCustomerId`/`stripeConnectAccountId` unique/sparse) | P0.4, P0.5 | — |
| P0.8 | Backend: `POST /auth/register` (owner self-signup: creates `User`+`Owner`), `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | P0.6, P0.7 | — |
| P0.9 | Backend: middleware chain — `authenticate`, `requireRole(...)`, `scopeToOwner` | P0.8 | — |
| P0.10 | Backend: Super Admin seed script (`npm run seed:admin` or similar CLI) | P0.7 | — |
| P0.11 | Frontend: `lib/api.ts` typed client + `lib/auth-context.tsx` (user/role/ownerId, login/logout, 401→refresh) | P0.3 | — |
| P0.12 | Frontend: `(auth)` route group — login/register pages wired to the real API | P0.9, P0.11 | — |
| P0.13 | Frontend: role-guarded layouts for `admin/`, `dashboard/`, `portal/` route groups (redirect on role mismatch) | P0.12 | — |

**Validation (end of phase):**
- `npm run dev` at the root boots both apps without errors.
- `POST /api/v1/auth/register` with a test payload creates a Mongo doc in both `users` and `owners` collections (verify in Atlas or via `GET /auth/me` with the returned token).
- Logging in via the frontend `/login` page lands on `/dashboard` for an owner and redirects away from `/admin`.
- Seed script creates a `super_admin` user that can log in and land on `/admin`.

---

## Phase 1 — Property / Unit / Lease / Tenant Management

| ID | Task | Depends on | Parallel Group |
|----|------|-----------|-----------------|
| P1.1 | Backend: `Property` model + `/properties` CRUD, owner-scoped | P0.9 | **A** (chain) |
| P1.2 | Backend: `Unit` model + `/properties/:id/units` + `/units/:id` CRUD, owner-scoped | P1.1 | **A** (chain) |
| P1.3 | Backend: `Lease` model + `/leases` CRUD + `/leases/:id/terminate`, owner-scoped | P1.2 | **A** (chain) |
| P1.4 | Backend: `Tenant` model + `/tenants` (list/invite), `/tenants/:id`, accept-invite token flow (`POST /auth/accept-invite`) | P0.9 | **B** |
| P1.5 | Backend: Super Admin `/owners` endpoints (list, suspend, activate) | P0.9 | **C** |
| P1.6 | Frontend: property list/detail pages (`dashboard/properties`) | P1.1 | **D** (chain) |
| P1.7 | Frontend: unit management UI under property detail | P1.2, P1.6 | **D** (chain) |
| P1.8 | Frontend: lease creation/detail UI | P1.3, P1.7 | **D** (chain) |
| P1.9 | Frontend: tenant invite + list UI (`dashboard/tenants`) | P1.4 | **E** |
| P1.10 | Frontend: Super Admin owners list page (`admin/owners`) | P1.5 | **F** |

**Parallel execution for this phase:** run Groups A, B, C simultaneously on the backend (they touch disjoint files/routes); once each backend group lands, its matching frontend group (D, E, F) can proceed independently of the others.

**Validation (end of phase):**
- As an owner: create a property → add a unit → create a lease → invite a tenant → tenant accepts invite and can log in, landing on `/portal`.
- Confirm a second owner account cannot see the first owner's properties/units/leases/tenants (manually test cross-tenant isolation — hit `GET /properties` as owner B and confirm owner A's data is absent).
- Super Admin can view all owners and toggle suspend/activate; a suspended owner's dashboard write actions are blocked (verify after Phase 2's `requireActiveSubscription` is wired, or stub the check now).

---

## Phase 2 — Stripe SaaS Subscription Billing

| ID | Task | Depends on | Parallel Group |
|----|------|-----------|-----------------|
| P2.1 | Stripe setup: create Products/Prices in Stripe Dashboard (or a seed script), backend `Plan` model + `/plans` (public GET, admin CRUD), seed 2–3 tiers | P0.9 | **A** |
| P2.2 | Backend: Stripe Customer creation on owner registration (retrofit `POST /auth/register`) | P0.8 | **B** |
| P2.3 | Backend: `POST /subscriptions/checkout-session` and `POST /subscriptions/portal-session` | P2.1, P2.2 | — |
| P2.4 | Backend: `WebhookEvent` collection + `/webhooks/stripe` raw-body route + signature verification + idempotency check | — | **C** (independent of P2.1-3) |
| P2.5 | Backend: webhook handlers for `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*` → sync `Owner.subscription` | P2.4, P2.3 | — |
| P2.6 | Backend: `requireActiveSubscription` + `enforcePlanLimits` middleware, wired into Phase 1's create routes | P2.5, P1.1–P1.4 | — |
| P2.7 | Frontend: public pricing page | P2.1 | **D** |
| P2.8 | Frontend: billing settings page (`dashboard/billing`) — plan display, checkout redirect, "Manage Billing" portal link | P2.3 | **E** |
| P2.9 | Frontend: trial/past-due banners in the dashboard shell | P2.6 | — |

**Validation (end of phase):**
- Use the Stripe CLI (`stripe listen --forward-to localhost:<port>/api/v1/webhooks/stripe`) to trigger a test checkout; confirm `Owner.subscription.status` flips to `active` in the DB.
- Trigger a simulated `invoice.payment_failed` event and confirm the dashboard shows the past-due banner and blocks a create-property request with a clear error.
- Attempt to exceed `Plan.limits.maxProperties` and confirm a 403 with an upgrade message.

---

## Phase 3 — Stripe Rent Payments + Connect Payouts

| ID | Task | Depends on | Parallel Group |
|----|------|-----------|-----------------|
| P3.1 | Backend: Connect Express onboarding (`POST /owners/me/connect/onboard`, Account Link generation) | P0.9 | **A** |
| P3.2 | Backend: `account.updated` webhook handler → sync `chargesEnabled`/`payoutsEnabled` | P2.4, P3.1 | — |
| P3.3 | Backend: `Payment` model + generation logic on lease activation (~12 months upfront) + daily late-fee cron job | P1.3 | **B** |
| P3.4 | Backend: `POST /payments/me/checkout-session` (renter online payment, `transfer_data.destination`) | P3.2, P3.3 | — |
| P3.5 | Backend: `payment_intent.succeeded/failed`, `charge.refunded` webhook handlers | P2.4, P3.4 | — |
| P3.6 | Backend: `POST /payments/manual` (owner/staff manual cash/check recording) | P3.3 | **C** |
| P3.7 | Backend: `GET /payments` (owner list/filter), `GET /payments/:id/receipt` | P3.3 | **C** |
| P3.8 | Frontend: Connect onboarding UI (`dashboard/settings/payments`) | P3.2 | **D** |
| P3.9 | Frontend: owner payments dashboard (list, filter, manual entry form, receipt view) | P3.6, P3.7 | **E** |

**Validation (end of phase):**
- Complete Stripe Connect Express onboarding in test mode; confirm `chargesEnabled` flips true after the `account.updated` webhook.
- Pay a test rent payment as a renter via Stripe test cards; confirm the `Payment` doc updates to `paid` and the owner dashboard reflects it.
- Record a manual cash payment and confirm it appears identically in the owner payments list without touching Stripe.

---

## Phase 4 — Tenant/Renter Portal

| ID | Task | Depends on | Parallel Group |
|----|------|-----------|-----------------|
| P4.1 | Backend: `GET /tenants/me`, `GET /tenants/me/lease`, `GET /payments/me` | P1.4, P3.3 | — |
| P4.2 | Frontend: `/portal` lease summary page | P4.1 | **A** |
| P4.3 | Frontend: `/portal` payment history + pay-now flow | P4.1, P3.4 | **B** |
| P4.4 | Frontend: `/portal` receipt view page | P4.1 | **A** |

**Validation (end of phase):**
- Log in as a renter, view the current lease, view payment history, successfully pay an outstanding rent payment through the portal, and view/print the receipt.

---

## Phase 5 — Polish (later, not MVP-blocking)

| ID | Task | Depends on | Parallel Group |
|----|------|-----------|-----------------|
| P5.1 | Transactional email (invite, receipt, reminder, dunning) via a provider (SendGrid/Postmark/SES) | Phases 1–3 | **A** |
| P5.2 | Owner dashboard analytics (occupancy, rent collected vs due) + Super Admin MRR stats | Phases 1–3 | **B** |
| P5.3 | Maintenance request tracking module (model + API + UI) | Phase 1 | **C** |
| P5.4 | Staff role: permission matrix + management UI | Phase 0 role scaffolding | **D** |
| P5.5 | SMS reminders, PDF receipts/leases, audit logging, rate-limit hardening | Phases 1–4 | **E** |

These five tracks are mutually independent — assign/run them in any combination in parallel once MVP (Phases 0–4) is stable.

---

## Parallel Execution Guide

Within a phase, tasks sharing a **Parallel Group** letter touch disjoint files and have no cross-dependency — safe to build simultaneously via separate terminal sessions, separate git branches, or by asking Claude Code to work on them in separate worktrees/background agents. General pattern across this whole plan:
- **Backend vs. frontend scaffolding** (Phase 0, Group A) — always parallelizable once the monorepo skeleton exists.
- **Independent backend resource chains** (e.g. Phase 1's Property→Unit→Lease chain vs. Tenant vs. Super Admin/Owners) — parallelizable because they're different collections/routes with no shared code.
- **Webhook infrastructure vs. the feature that triggers it** (e.g. Phase 2's `WebhookEvent`/webhook route setup, Group C, vs. Checkout/Portal session endpoints, Group B) — the webhook *scaffolding* doesn't need the checkout flow to exist first, only the specific event handlers do.
- **Frontend pages for independent backend features** (e.g. Phase 3's Connect onboarding UI vs. the payments dashboard) — parallelizable once their respective APIs exist.

Do not parallelize a chain task with its own dependency (e.g. Unit CRUD before Property CRUD exists) — the `Depends on` column is the source of truth.

---

## Progress Tracking

Copy this checklist and check items off as you complete and validate them:

- [x] Phase 0 (P0.1–P0.13)
- [x] Phase 1 (P1.1–P1.10)
- [x] Phase 2 (P2.1–P2.9)
- [ ] Phase 3 (P3.1–P3.9)
- [ ] Phase 4 (P4.1–P4.4)
- [ ] Phase 5 (P5.1–P5.5, optional/parallel tracks)
