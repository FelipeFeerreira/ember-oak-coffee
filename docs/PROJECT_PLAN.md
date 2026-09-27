# Project scope and phase gates

All site content, code comments and documentation are in English. Build in this repository
root. Keep secrets in `.env.local`, with names and instructions in `.env.example`.

The owner supplied the complete scope on September 26, 2026. Work remains divided into
phases: test, typecheck, build and audit each phase, report results, and wait for approval
before the next one. Account creation, external environment configuration, paid actions
and deployment require approval. Never rewrite `main` history.

| Phase | Deliverable | Current state |
| --- | --- | --- |
| 1 — Store | Home, filtered catalog, product detail, persistent cart, About, FAQ, seeded Postgres products, accessible premium design | Approved and merged into `main` |
| 2 — Checkout | Test Stripe Checkout, signed idempotent webhook, transactional stock, confirmation page/email with Resend fallback, order tracking by number + email | Approved and merged into `main`; external activation deferred by owner |
| 3 — AI assistant | Floating streaming Claude Haiku widget, database product tools/cards, private order lookup, human leads, store-only guardrails, Postgres IP/session limits, bounded history/tokens, prompt caching, missing-key fallback and cost estimate | Completed and merged into `main` when the owner resumed the coffee project |
| 4 — Owner dashboard | Token-protected `/admin`, orders, transcripts, editable lead status, conversations/recommendations/add-to-cart/questions metrics | Implemented and validated on `feat/admin-dashboard`; awaiting review |
| 5 — Tests | Complete unit, real-Postgres integration, mocked-Claude tool/safety tests and desktop/mobile E2E including chat and checkout | Pending; regression tests are also added in each phase |
| 6 — Demo and portfolio | Seven-day cleanup and seed stock restoration under `DEMO_MODE`, Vercel + Neon guide, authorized deployment, screenshots and cover, finished README, GitHub metadata and final audit | Pending |

Use one branch per phase and small Conventional Commits. Commit only after tests and
typecheck pass. Merge an approved phase with a merge commit. Before the first push,
show the full history and receive approval. Public repository target: `ember-oak-coffee`.

## GitHub connection still pending

The GitHub CLI is installed but was not authenticated during phase 2. No remote repository
has been created. The owner can authenticate locally using `gh auth login`, or use
GitHub Desktop after approving repository creation and the first push:

1. Choose **File → Add local repository** and select this `portfolio2` folder.
2. Review the **History** tab and approve the full commit history before publishing.
3. Choose **Publish repository** with name `ember-oak-coffee` and description
   `A specialty coffee storefront with secure test checkout and an AI shopping assistant.`
4. Uncheck **Keep this code private** to publish publicly, only after approval.
5. Publish `main` with approved work; do not merge an unfinished phase just to publish it.

## Final portfolio requirements

- Demo cleanup: remove orders, leads and conversations older than seven days and restore
  catalog stock to seed quantities. Keep the scheduler protected and gated by `DEMO_MODE`.
- Deploy only after approval, with all variables documented, Vercel connected to `main`,
  and a reminder to set an Anthropic monthly spending limit before public launch.
- `scripts/screenshots.ts`: high resolution (`deviceScaleFactor: 2`), realistic sample data,
  no admin token in screenshots or captured URLs. Capture home, catalog, product, cart,
  product recommendations in chat, order lookup in chat, admin metrics, mobile home and chat.
- Optimized screenshots under 500 KB in `docs/screenshots/`; high quality Upwork images
  and a 1600×1200 desktop/mobile-chat cover in ignored `portfolio-assets/upwork/`.
- README: live demo/video TODO links, hero/screenshots, owner-oriented benefits, stack,
  chatbot tools/guardrails/cost controls, setup/tests, photo credits and fictional-concept note.
- GitHub: description, live website URL, and topics `nextjs`, `typescript`, `ecommerce`,
  `stripe`, `ai-chatbot`, `claude`, `prisma`, `postgresql`.
- Final review: clean status, complete commit history, no secrets or portfolio assets in
  history; approved final merge/push; live/repository URLs and Upwork file locations.
