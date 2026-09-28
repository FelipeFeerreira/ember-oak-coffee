# Test strategy and verification

The test suite checks the store's business rules, privacy boundaries and customer
flows. Unit counts are not a claim of 100% statement or branch coverage.

## Run the full suite locally

Use Node.js 24 and Docker Desktop. From the project root:

```powershell
npm.cmd ci
# Copy .env.example to .env.local only on first setup; keep existing private values.
docker compose up -d
npx.cmd prisma migrate deploy
npm.cmd run db:seed
npm.cmd run admin:token
npm.cmd test
npm.cmd run test:integration
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd audit
```

Start `npm.cmd run start` in one terminal, then run the browser suite in another:

```powershell
npm.cmd run test:e2e -- --workers=2
```

Use a fresh production preview after changes, so tests do not accidentally use a
stale server and cold development compilation does not consume assertion timeouts.
Playwright reuses port 3100 when an app is already running; otherwise its configuration
starts a development server. Stop the old preview before rebuilding. Never reset a
database with real customer records just to run tests. Seeding restores demo prices
and stock, so it belongs only in the local portfolio database.

Integration tests apply migrations to the separate local `ember_oak_test` database.
The runner refuses remote databases and names that do not end in `_test`. Database
suites run sequentially because their fixtures share this disposable database.
Storefront/browser tests use the seeded development catalog rather than that test
database. No external API credentials are needed for payment or AI test cases.

## Coverage map

| Requirement | Evidence |
| --- | --- |
| Integer money, cart totals and shipping boundaries | `tests/unit/pricing.test.ts` |
| Cart persistence, duplicate lines and changed-cart confirmation | `tests/unit/cart-store.test.tsx` |
| Quantity, grind, checkout and catalog validation | `tests/unit/cart-schema.test.ts`, `checkout-schema.test.ts`, `catalog-filters.test.ts` |
| Database-safe price filters | Unit regressions for huge numeric URL values and the largest valid whole-dollar bound |
| Signed, idempotent Stripe webhook | `tests/integration/checkout.test.ts`: forged/stale signatures, concurrent duplicate events, distinct events for one payment |
| Atomic stock and payment confirmation | Same suite: rollback after amount/currency/reference mismatch or a database constraint; competing buyers enter payment review instead of negative stock |
| Checkout retry and private tracking | Same suite: Stripe idempotency keys, server-priced snapshots, email retry, matching both order credentials, safe response fields |
| Persistent limits | Concurrent Postgres limiter calls, window expiry, per-session/per-IP chat limits, global AI cap and owner login limits |
| Bot tools and guardrails | `tests/unit/chat-agent.test.ts`: mocked Claude output, invalid tool arguments, invented policy text, off-topic replies, history/token bounds and human handoff |
| Real catalog filtering | `tests/integration/chat.test.ts`: combined roast/brew/type/acidity/price filters, case-insensitive name matching and stock exclusion |
| Prices in a rendered recommendation card | Same suite renders the actual React card from a tool's database result while mocked Claude claims a different price; a database price change is then reread |
| Conversation isolation and failed calls | Same suite: private cookies, lease ownership, retry suppression, transcript isolation, price refresh and provider failure recovery |
| Owner access and editable leads | `tests/integration/admin.test.ts`, `tests/unit/admin-lead.test.tsx`: revocation, expiry, token rotation, same-origin checks, stale status conflicts and UI feedback |
| Desktop and mobile shopping | `tests/e2e/store.spec.ts`, `checkout.spec.ts`, `chat.spec.ts`: browse, filters, product/grind selection, persisted cart, Stripe redirect, tracking and chat |
| One continuous customer journey | `tests/e2e/customer-journey.spec.ts`: browse → select grind → add to cart → tamper with stored prices → server-priced cart → open chat → Stripe redirect boundary |
| Desktop and mobile owner workspace | `tests/e2e/admin.spec.ts`, `admin-owner.spec.ts`: access denial, authenticated navigation and logout |

## Provider boundaries

- Stripe events are signed locally using the SDK's test-header helper. The webhook,
  transaction and stock queries are real; Checkout Session requests are mocked.
- Resend is mocked, including temporary send failures and retry behavior.
- Claude is mocked in unit and integration tests. Browser chat tests intercept the
  application's chat endpoint. They verify the UI contract, not the real model's
  reasoning or service availability.
- Browser payment tests intercept the hosted Stripe URL. They stop at the redirect
  boundary and do not claim to complete a hosted payment or verify wallets.

Real hosted Stripe checkout, delivered email and live Claude behavior remain manual
checks after external configuration is explicitly approved. Guardrail tests cover
specific attacks and constrained output paths, not every possible adversarial prompt.

## Credentials and artifacts

The authenticated owner browser test reads the locally configured `ADMIN_TOKEN` and
requires it to match the running app. It skips if owner access is unconfigured or
the target is remote. It never sends a local token to a remote `E2E_BASE_URL`.

Traces, screenshots and video are disabled for this authenticated test because a
trace can contain the login request body. Do not override that setting when recording.
Other browser tests can retain failure artifacts under ignored `test-results/`.
Never publish private environment files, database dumps or raw authentication traces.

## Phase 5 verification

**149 tests passed:** 63 unit/component tests, 46 real-Postgres integration tests
and 40 browser tests across desktop and mobile. Typecheck, lint and production
build passed. npm audit reported zero vulnerabilities.

The oversized-price regression failed before the fix and passed afterward. The
phase status is recorded in the project plan. No account, deployment or paid
provider call was part of this verification phase.

## Phase 6 local verification

**155 tests passed:** 63 unit/component, 52 real-Postgres integration and 40 desktop/mobile
browser tests. Typecheck, lint and production build passed; npm audit reported zero
vulnerabilities. Six new cleanup tests verify authentication and explicit demo gating,
live-key rejection, the strict seven-day boundary, cascade deletion, price preservation,
daily retry/concurrency behavior, and full transaction rollback after a failed stock update.

The screenshot runner generated nine views plus a 1600 × 1200 cover from an isolated
local database. Every optimized image is below 500,000 bytes. Images were visually
reviewed; their staged-data provenance is recorded in the manifest. Deployed-site
screenshots and real provider checks remain pending approved external setup.
