# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository has no code yet — only `plan.md` (the implementation plan) exists. Before writing code, read `plan.md` in full; it defines the architecture, data model, API surface, and phased roadmap for this project. Regenerate this file with `/init` once Phase 0 scaffolding exists, so real build/lint/test commands and actual code architecture can be documented here.

## Fixed constraints (do not deviate without asking the user)

- Backend uses the official native MongoDB Node.js driver (`mongodb` package) against MongoDB Atlas — **never add Mongoose or any ODM**. Document shapes are plain TypeScript interfaces in `backend/src/models/*.ts`; collection access goes through typed getters in `backend/src/db/collections.ts`.
- MongoDB Atlas hosts the database only. The user supplies the Atlas connection URI via `MONGODB_URI`; do not assume a local/in-memory Mongo instance (tests also run against a dedicated Atlas test database, not `mongodb-memory-server`).
- Stack: Next.js + TypeScript frontend (Tailwind as the primary CSS framework; Bootstrap, if ever needed, must stay scoped to a `components/legacy-bootstrap/` subtree — never load it globally alongside Tailwind). Node.js/Express backend as a separate standalone REST API (not Next.js API routes).
- Multi-tenancy: every owner-scoped MongoDB collection carries an `ownerId` field, and every query must be filtered by the authenticated user's `ownerId` from the JWT — never a client-supplied value. This is the single highest-risk area for cross-tenant data leaks.
- Payments: Stripe only. Stripe Billing for the owner's SaaS subscription, Stripe Connect for renter→owner rent payments. Stripe webhooks (not client-side redirects) are the only source of truth for payment/subscription status changes.
- Frontend deploys to Vercel; backend hosting is intentionally left open (build host-agnostic, env-var driven).

See `plan.md` for full data model, API routes, auth middleware chain, billing/payment flows, and the phased roadmap.
