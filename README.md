# Ember & Oak Coffee Roasters

A small online coffee store with an AI shopping assistant, built as a portfolio project.

> **Portfolio concept:** brand, products and reviews are fictional.

🚧 Work in progress — the full README (live demo, screenshots, chatbot details) arrives with the final phase.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui · PostgreSQL + Prisma 7 · Zod ·
Vitest + React Testing Library · Playwright

Stripe Checkout (test mode) · Resend (optional confirmation emails) · Anthropic SDK (Claude Haiku 4.5)

## Current progress

The storefront and test checkout are complete. Phase 3 adds a floating AI coffee guide,
database-backed product recommendations, private order lookup and a human-support form.
The owner dashboard and deployment are planned in later phases.

See [the project plan](docs/PROJECT_PLAN.md) and [the checkout guide](docs/CHECKOUT.md).
See [the chat guide](docs/CHAT.md) for tools, privacy, cost controls and local setup.

The chat opens on every page. Without `ANTHROPIC_API_KEY`, it explains that AI replies
are unavailable while the FAQ, order-tracking link and support-request form still work.
Support requests are saved locally; no real support response is sent in this demo.

## Run it locally

Requirements: Node.js 24+, Docker.

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run db:up                   # start Postgres in Docker (port 5433)
npx prisma migrate deploy       # create the tables
npm run db:seed                 # load the product catalog
npm run dev                     # http://localhost:3100
```

## Tests

```bash
npm test            # unit and component tests (Vitest)
npm run test:integration # isolated local Postgres tests; Docker must be running
npm run test:e2e    # end-to-end tests (Playwright, desktop + mobile)
npm run typecheck
npm run lint
npm run build
npm audit
```

## Why things are built this way

See [DECISIONS.md](./DECISIONS.md) for every important technical decision, explained in plain language.

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if the system blocks `.ps1` scripts.
No execution-policy change is needed.

Integration tests automatically apply migrations to `ember_oak_test`, refuse remote
or non-test databases, and replace Stripe/Resend network calls with test doubles.
Playwright covers the redirect boundary using an intercepted Stripe URL; it does not
perform an actual hosted Stripe payment. See the checkout guide for that manual check.
