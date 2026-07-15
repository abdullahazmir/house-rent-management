# Execution Task List — Rubric Compliance & Self-Service Rentals (Phase 6)

Companion to `TASKS.md`, breaking `plan2.md` into discrete, checkable tasks. Phases 0–5 in `TASKS.md` are complete; this file adds **Phase 6** on top of that foundation. Same conventions as `TASKS.md`: work top to bottom, tasks sharing a **Parallel Group** letter within a phase have no dependency on each other, tasks outside any group are sequential. This supersedes the earlier draft of `TASKS2.md` — it folds in the role-selection/self-service-rental additions to `plan2.md`, not just the rubric-mapping (browse/listings/charts/demo-login) work.

## How to use this file

1. Pick the next unchecked task whose `Depends on` tasks are already checked off.
2. Do the work.
3. Run the listed **Validation** step yourself and confirm it passes before checking the box.
4. Check the box (`- [x]`) and move on.

---

## Phase 6 — Public Listings, Self-Service Rentals & Rubric Compliance

| ID | Task | Depends on | Parallel Group |
|----|------|-----------|-----------------|
| P6.1 | Backend: data model additions — `UnitDoc` gets `imageUrl`, `marketingDescription`, `isPubliclyListed`; `PropertyDoc` gets `imageUrl` (`backend/src/models/Unit.ts`, `Property.ts`). No change needed to `User.ts` — `ownerId: ObjectId \| null` is already nullable. | — | — |
| P6.2 | Backend: new index `{isPubliclyListed:1, status:1}` on `units` in `src/db/connection.ts#createIndexes` | P6.1 | **A** |
| P6.3 | Backend: extend `unit.controller.ts` create/update handlers to accept the 3 new fields (owner-scoped, existing auth chain unchanged) | P6.1 | **A** |
| P6.4 | Backend: verify/extend `analytics.controller.ts` (`/analytics/owner`, `/analytics/admin`) to return chart-ready time series | — | **B** |
| P6.5 | Backend: `GET /public/units` — new `publicListing.routes.ts` + `publicListing.controller.ts`, no auth, aggregation pipeline (`$match` public+vacant → `$lookup` properties → filter/sort/paginate → `$facet`) | P6.2 | — |
| P6.6 | Backend: `GET /public/units/:id` (same join, single doc, 404 if not public+vacant) | P6.5 | — |
| P6.7 | Backend: `seed-demo.ts` script (drives real `/auth/register` + property/unit creation via authenticated API calls; ensures demo `super_admin` exists) + `"seed:demo"` script in `backend/package.json` | P6.3 | **C** |
| P6.8 | Backend: extend `POST /auth/register` (`auth.controller.ts`, `auth.validators.ts`) to accept `role: 'owner' \| 'renter'`. Owner branch unchanged (User+Owner+Stripe customer). Renter branch: create only a `User` doc (`role: 'renter'`, `ownerId: null`). | — | **K** |
| P6.9 | Backend: `POST /public/units/:id/rent` — authenticated (`renter` role only), derives `ownerId` from the target Unit doc (never client/JWT). Re-validates vacant+public → creates `Tenant` (reuse `acceptInvite`'s tenant-creation pattern) → creates `Lease` (reuse existing lease-activation service, generates upfront `Payment`s) → flips `Unit.status` to `occupied` → `$set`s the User's `ownerId` from `null` → re-issues access+refresh tokens (same shape as `login`) → returns the new Lease's first `Payment` id. Reject if the renter already has an active lease. | P6.6, P6.8 | — |
| P6.10 | Frontend: reusable primitives `components/ui/ListingCard.tsx`, `components/ui/Skeleton.tsx` | P6.1 (mirror new fields in `types/models.ts`) | **D** |
| P6.11 | Frontend: `app/listings/page.tsx` — search bar, filters (city, property type, min bedrooms, max rent), sort, pagination, 4-per-row card grid, skeleton loading state | P6.6, P6.10 | — (chain) |
| P6.12 | Frontend: `app/listings/[id]/page.tsx` — image, overview, specifications, related units, plus **"Rent this house"** button: logged out → `/register?role=renter&unitId=<id>`; logged-in renter → calls `POST /public/units/:id/rent`, swaps in the re-issued token, redirects into the existing renter Stripe checkout for the returned Payment id; other roles → hidden/disabled | P6.9, P6.10, P6.15 | — (chain) |
| P6.13 | Frontend: extend `dashboard/properties` unit form with `imageUrl`, `marketingDescription`, `isPubliclyListed` toggle | P6.3 | **E** |
| P6.14 | Frontend: `app/items/add/page.tsx`, `app/items/manage/page.tsx` — thin redirects (anon → `/login`; owner → `/dashboard/properties`, add variant auto-opens the form) | P6.13 | — |
| P6.15 | Frontend: `(auth)/register` role selector ("List properties for rent" / "Find a house to rent"); owner branch keeps `companyName`, renter branch drops it; on success, redirect back to the remembered `unitId` listing page if present, else `ROLE_HOME[role]` | P6.8 | — |
| P6.16 | Frontend: `components/layout/SiteNavbar.tsx` rendered in `app/layout.tsx` above `{children}`/`Footer` — logged out: Home/Listings/Login/Register; logged in: role dashboard link + Listings + Logout. Existing `AdminNav`/`DashboardNav`/`PortalNav` untouched underneath it. | — | **J** |
| P6.17 | Frontend: `portal/page.tsx` (and wherever `/tenants/me/lease`, `/payments/me` are called) — catch the existing 403 ("This account is not associated with an owner") from `scopeToOwner` and render a "Browse available houses" empty state instead of a generic error. No backend change. | — | **L** |
| P6.18 | Frontend: landing page `FeaturedListings` section (pulls a few cards from `/public/units`) | P6.6 | **F** |
| P6.19 | Frontend: landing page `StatsSection`, `Testimonials`, `FAQ`, `NewsletterCTA` sections (reach the 7-section minimum) | — | **F** |
| P6.20 | Frontend: `app/about/page.tsx`, `app/contact/page.tsx`, `app/(marketing)/privacy/page.tsx`, `app/(marketing)/terms/page.tsx` + wire `Footer.tsx` links to them | — | **G** |
| P6.21 | Frontend: install `recharts`; add occupancy pie chart + rent collected-vs-due trend chart to `dashboard/page.tsx`, MRR trend chart to `admin/page.tsx` | P6.4 | **H** |
| P6.22 | Frontend: "Demo login" button on `/login` (autofills + submits seeded demo owner credentials); document demo admin credentials in `README.md` | P6.7 | **I** |

**Parallel execution for this phase:** Groups A (index + unit controller), B (analytics), C (seed script), D (frontend primitives), E (properties form), F (landing sections), G (static pages), H (charts), I (demo login), J (navbar), K (register role branch, backend), and L (portal empty-state, frontend-only) all touch disjoint files and can run concurrently once their own `Depends on` are satisfied. Two sequential chains matter: the public API chain (P6.5 → P6.6 → P6.11 / P6.18), and the rental chain (P6.8 → P6.9 → P6.15 → P6.12) — don't parallelize within either chain.

**Validation (end of phase):**
- `npm run build` in both `backend/` and `frontend/` — zero TypeScript errors.
- Log out and browse `/listings`: search, filter on ≥2 fields simultaneously, sort, paginate, open a details page — all functional with no auth token.
- As an owner, toggle a unit's `isPubliclyListed` in `dashboard/properties` and confirm it appears/disappears from `/listings`; confirm occupied or non-public units never appear.
- From a listing's details page while logged out, click "Rent this house" → land on `/register` with Renter preselected and the unit remembered.
- Register as a renter with no prior invite → land on `/portal` → see the "browse houses" empty state (confirms P6.17's 403-handling, not an error page).
- As that renter, go back to the remembered listing and click "Rent this house" → Lease+Tenant created, unit flips to occupied, redirected into Stripe checkout for the first month's rent; after paying, `/portal` shows the new lease.
- Confirm that unit no longer appears in `/listings`.
- Confirm a renter who already has an active lease gets a clear error trying to rent a second house.
- Confirm the existing owner-invite tenant flow (Phase 1/4) still works unchanged, side by side with self-service renting.
- Confirm `/items/add` and `/items/manage` redirect an anonymous visitor to `/login`, and route a logged-in owner into the real properties CRUD.
- Run `npm run seed:demo`; log in via the Demo login button (owner) and manually as the demo admin.
- Confirm the global navbar renders correctly logged out and for each role, with the existing per-section navs still rendering underneath it.
- Visually confirm `dashboard/page.tsx` and `admin/page.tsx` render actual charts, not just number tiles.
- Click every link in `Footer.tsx` and confirm none 404.

---

## Progress Tracking

- [x] Phase 6 (P6.1–P6.22)
