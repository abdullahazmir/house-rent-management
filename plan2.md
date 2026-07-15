# plan2.md — Mapping the TypeScript Project Rubric onto House Rent Management

## Context

The user has an external full-stack project rubric (frontend/backend/DB/auth/API/UI-UX requirements, evidently for a course or assignment submission) and wants it satisfied *inside* the existing house-rent-management SaaS rather than as a throwaway project. Phases 0–5 of the original `plan.md`/`TASKS.md` roadmap are already built and validated (multi-tenant auth, property/unit/lease/tenant CRUD, Stripe subscription billing, Stripe Connect rent payments, renter portal). This plan (`plan2.md`) is an **additive layer** on top of that: a new "Phase 6" that fills the specific gaps the rubric requires but the SaaS doesn't yet have.

Two rounds of decisions have shaped this plan:

**Round 1 (rubric mapping):**
1. The rubric's generic "Items" (public card grid → details page → protected Add/Manage) maps to **Rental Units** — vacant units an owner opts to publicly list, reusing the existing `UnitDoc`/`PropertyDoc` models.
2. The protected "Add Item"/"Manage Item" pages **extend the existing owner Property/Unit CRUD** (`dashboard/properties`) rather than a separate build.
3. Reviews/ratings and social login are **out of scope**.
4. A **`seed:demo` script** creates fixed demo credentials (owner + admin).

**Round 2 (self-service rental flow — extends the above, and amends one of `plan.md`'s original fixed assumptions):**
5. **Registration gets a role selector**: "List properties for rent" (Owner — today's existing flow, unchanged) vs. "Find a house to rent" (Renter — **new**: self-service signup, not tied to any owner/invite at creation time). This coexists with, and does not replace, the existing owner-invite flow for tenants — `plan.md`'s "Renters are created/invited by an Owner" is now *one of two* ways a Renter account can come into being, not the only way.
6. When a logged-in renter clicks "Rent" on a public listing and completes the Stripe payment, this is **instant self-service**: it immediately creates the Tenant + Lease and flips the unit to occupied — no owner-approval step in between.
7. A new global navbar goes in the root layout (`app/layout.tsx`, which today renders only `AuthProvider`+`Footer` — no nav at all) as an **additional top bar**, adaptive to auth state/role. The existing `AdminNav`/`DashboardNav`/`PortalNav` stay as-is for in-section navigation underneath it.
8. The Stripe payment triggered by "renting" a house is the Lease's **first month's rent**, paid through the existing renter checkout flow (`POST /payments/me/checkout-session`, built in Phase 3/4) — no new Stripe/PaymentIntent logic needed.

## Rubric → Product Mapping

| Rubric requirement | Concrete mapping in this app |
|---|---|
| "Items" (cards, details, add, manage) | Rental Units with `status: 'vacant'` and a new `isPubliclyListed: true` flag |
| Core listing/card section | New public `/listings` page |
| Details page | New public `/listings/[id]` page, now with a **"Rent this house"** action |
| Explore page: search, filter (≥2 fields), sort, pagination | Same `/listings` page — query params on a new public API endpoint |
| Protected "Add Items" (`/items/add`) | Thin route redirecting into the existing `dashboard/properties` add-unit flow |
| Protected "Manage Items" (`/items/manage`) | Thin route redirecting into the existing `dashboard/properties` list |
| Charts (Recharts/Chart.js) | Added to `dashboard/page.tsx` and `admin/page.tsx` |
| Demo login button | `seed:demo` script + autofill button on `/login` |
| Additional pages (≥2) | About, Contact, Privacy, Terms + working `Footer.tsx` links |
| "Max 3 primary colors + neutral" | No visual change — existing 5-variable brand palette reframed as 3 primary + 2 neutral for submission docs |
| **Role selection at registration** | **New**: registration form branches on Owner vs Renter |
| **Role-based dashboard routing** | Already exists (`ROLE_HOME`, `RoleGuard`, `admin`/`dashboard`/`portal` layouts) — just needs the renter-with-no-lease-yet empty state handled gracefully |
| **Global navbar** | **New**: `components/layout/SiteNavbar.tsx` rendered in `app/layout.tsx` |
| **Browse → details → rent action → Stripe** | **New**: `/listings/[id]`'s "Rent this house" button, gated on auth, creates Tenant+Lease server-side, redirects into the existing renter payment-checkout flow |
| Reviews/ratings, social login | Explicitly skipped |

## Data Model Changes

- `backend/src/models/Unit.ts` (`UnitDoc`): add `imageUrl: string | null`, `marketingDescription: string | null`, `isPubliclyListed: boolean`.
- `backend/src/models/Property.ts` (`PropertyDoc`): add `imageUrl: string | null`.
- `backend/src/models/User.ts` (`UserDoc`): **no change needed** — `ownerId: ObjectId | null` is already nullable (confirmed by reading the model). A self-registered Renter is created with `ownerId: null` until they complete a self-service rental (at which point it's `$set` to the target owner's id — see below).
- New index: `units` collection `{ isPubliclyListed: 1, status: 1 }`.
- No new collections — the rental action reuses the existing `Tenant`/`Lease`/`Payment` models, not a parallel "application"/"reservation" concept.

## Backend Additions

- **Public listing routes** (no auth), `publicListing.routes.ts` + `publicListing.controller.ts` at `/api/v1/public/units`:
  - `GET /public/units` — search/filter/sort/paginate via aggregation (`$match` public+vacant → `$lookup` properties → `$facet`).
  - `GET /public/units/:id` — single unit + property join, 404 if not public+vacant.
  - Prominent comment marking this as an intentional, reviewed exception to owner-scoping (public reads, no mutation).
- Extend `unit.controller.ts` create/update to accept the 3 new fields (unchanged owner-scoped auth chain).
- **`POST /auth/register`**: accept a `role: 'owner' | 'renter'` field.
  - `role: 'owner'` → today's unchanged path (User+Owner+Stripe customer).
  - `role: 'renter'` → creates only a `User` doc (`role: 'renter'`, `ownerId: null`), no `Owner`/`Tenant`/`Stripe` customer yet.
- **`POST /public/units/:id/rent`** — new endpoint, authenticated (any logged-in `renter`), but *not* behind `scopeToOwner` in the normal sense: it looks up the target `Unit`, derives `ownerId` **from the unit document itself** (never from the client or the renter's own JWT claim, consistent with the never-trust-client-ownerId rule), and:
  1. Re-validates the unit is still `vacant` + `isPubliclyListed` (race-safe — reject if already rented).
  2. Creates a `Tenant` doc for this user under that `ownerId` (reusing the existing tenant-creation logic used by the invite-accept flow, `auth.controller.ts#acceptInvite` is the template).
  3. Creates a `Lease` (reusing the existing lease-activation service that generates upfront `Payment` docs).
  4. Flips `Unit.status` to `occupied`.
  5. **`$set`s the User doc's `ownerId`** from `null` to the target owner's id (it's `null` since self-registration — this is a real write, not just a token concern).
  6. **Re-issues the renter's JWT/refresh token** with the now-populated `ownerId` claim — the old token was minted with `ownerId: null` and is now stale; the frontend must swap in the new token before calling any owner-scoped `/me` route. (`login`/`refresh` already correctly emit `ownerId: null` in the claim when absent, confirmed in `auth.controller.ts` — the token plumbing already supports a null-to-populated transition, this endpoint just needs to trigger a fresh sign the same way `login` does.)
  7. Returns the new Lease's first `Payment` id so the frontend can immediately redirect into `POST /payments/me/checkout-session`.
  - Simplifying assumption: a renter may only have **one active lease at a time** — reject the rent action if they already have one (surface a clear error, not a silent failure).
- **No change to `scopeToOwner` middleware.** It already throws a 403 ("This account is not associated with an owner") when `req.user.ownerId` is `null` (confirmed in `middleware/scopeToOwner.ts`) — that's existing, correct, high-risk tenant-isolation code and shouldn't be loosened. The renter-with-no-lease-yet empty state is handled entirely on the **frontend**: catch that specific 403 on `/tenants/me/lease` and `/payments/me` calls and render "Browse available houses" instead of a generic error banner.

## Frontend Additions

- `frontend/src/app/listings/page.tsx`, `frontend/src/app/listings/[id]/page.tsx`, `components/ui/ListingCard.tsx`, `components/ui/Skeleton.tsx` — as before.
- **`/listings/[id]`**: add a **"Rent this house"** button.
  - Logged out → link to `/register?role=renter&unitId=<id>` (registration form pre-selects Renter and remembers which unit to return to).
  - Logged in as renter → calls `POST /public/units/:id/rent`, swaps in the re-issued token from `auth-context`, then redirects straight into the existing renter Stripe checkout flow for the returned Payment id.
  - Logged in as owner/staff/admin → button hidden or disabled with an explanatory note (this action is renter-only).
- **`(auth)/register`**: add a role selector ("List properties for rent" / "Find a house to rent"). Owner branch keeps today's fields (companyName, contactName, email, password); renter branch drops `companyName`. On success, if a `unitId` query param is present, redirect back to that listing's details page to complete the rent action; otherwise `ROLE_HOME[role]` as today.
- **`app/layout.tsx`**: add `components/layout/SiteNavbar.tsx`, rendered above `{children}` (and above `Footer`). Logged out: Home / Listings / Login / Register. Logged in: role-appropriate dashboard link + Listings + Logout. Existing `AdminNav`/`DashboardNav`/`PortalNav` are untouched.
- **`portal/page.tsx`**: handle the "renter, no active lease yet" state (new, since self-registered renters can now land here before ever renting) — show a "Browse available houses" CTA linking to `/listings` instead of erroring on a missing lease.
- `/items/add`, `/items/manage` thin redirects, landing-page sections, About/Contact/Privacy/Terms, dashboard/admin charts, demo-login button — unchanged from Round 1.

## Verification

- `npm run build` in both apps — zero TypeScript errors.
- Browse `/listings` logged out, open a details page, click "Rent this house" → redirected to `/register` with Renter preselected and the unit remembered.
- Register as a renter with no prior invite → land on `/portal` → see the "browse houses" empty state (no lease yet).
- From `/listings/[id]` as that logged-in renter, click "Rent this house" → Lease+Tenant created, unit flips to occupied, redirected into Stripe checkout for the first month's rent; after paying, `/portal` shows the new lease.
- Confirm the same unit no longer appears in `/listings` (no longer vacant).
- Confirm a renter who already has an active lease gets a clear error if they try to rent a second house.
- Existing owner-invite tenant flow (Phase 1/4) still works unchanged, side by side with self-service renting.
- Global navbar renders correctly logged-out and for each role, and the existing per-section navs still render underneath it.
- All Round-1 verification items (search/filter/sort/pagination, `/items/*` redirects, `seed:demo`, charts, footer links) still hold.

## Open assumptions (flagging, not re-asking)

- One-active-lease-per-renter is a simplifying rule for this rubric-driven feature, not something `plan.md` specified; revisit if multi-lease renters are ever needed.
- Token re-issuance after the rent action assumes the existing JWT/refresh-cookie plumbing (`lib/api.ts`'s 401→refresh interceptor) can accept a fresh token pushed from a non-401 response; if the current `auth-context` shape doesn't support that cleanly, a lightweight `refreshSession()` call right after the rent action (re-hitting `/auth/refresh` or `/auth/me`) is the fallback.
- `/items/add`/`/items/manage` remain thin redirects (Round 1 assumption, unchanged).
- `seed-demo.ts` still drives the real registration API rather than raw inserts (Round 1 assumption, unchanged).
