# Ember & Oak Coffee Roasters

A small online coffee store with an AI shopping assistant, built as a portfolio project.

> **Portfolio concept:** brand, products and reviews are fictional.

🚧 Work in progress — the full README (live demo, screenshots, chatbot details) arrives with the final phase.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui · PostgreSQL + Prisma 7 · Zod ·
Vitest + React Testing Library · Playwright

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
npm run test:e2e    # end-to-end tests (Playwright, desktop + mobile)
npm run typecheck
npm run lint
```

## Why things are built this way

See [DECISIONS.md](./DECISIONS.md) for every important technical decision, explained in plain language.
