# Owner dashboard

Phase 4 adds a private `/admin` workspace. Its statistics use the actual retained
database records; it does not manufacture example sales or conversations.

## Open locally

1. Start Docker and run `npm.cmd run db:up`.
2. Apply migrations with `npx.cmd prisma migrate deploy`.
3. Run `npm.cmd run admin:token` from the project root. This creates a random token
   in the ignored `.env.local` file, only if one is not already configured.
4. Open `.env.local` locally and copy the `ADMIN_TOKEN` value. Do not share it in
   messages, commit it, put it in a URL or capture the file in a screenshot.
5. Restart the app after configuration changes. Run `npm.cmd run dev`, or use
   `npm.cmd run build` followed by `npm.cmd run start` for a production preview.
6. Open http://localhost:3100/admin and paste the token into the password field.

The token must contain 32–256 characters. A missing or shorter value disables
access rather than falling back to a default password. The helper uses 32 random
bytes encoded as 64 hexadecimal characters. It never prints the token.

This is a shared-secret gate for a single-owner portfolio demo, not a multi-user
identity system. Before offering a production dashboard to a real business,
replace it with a maintained identity provider, individual accounts and MFA.

## Views

- **Overview:** conversation count, distinct chat-to-cart conversion, open leads,
  paid test orders, seven-day activity, most recommended products and frequent topics.
- **Orders:** order number, status, customer name/email, purchased items and total.
  Orders are read-only here; only the signed Stripe webhook confirms payment.
- **Conversations:** paginated sessions and saved transcripts, including product
  recommendations and recorded cart clicks. Stored chat emails are redacted.
- **Support requests:** customer contact details and question, with editable
  Open / Contacted / Closed status. Saving a status never sends an email.

Lists show 20 records per page. Timestamps and daily chart boundaries use UTC.
Empty views explain when data will become available. Real provider credentials
are not required to inspect the interface, existing transcripts or saved leads.

## What the numbers mean

| Metric | Definition |
| --- | --- |
| Conversations | Retained sessions with at least one saved customer message; opening a widget alone does not count |
| Chat → cart | Distinct active conversations with at least one recorded recommendation add-to-cart click, divided by active conversations |
| Open requests | Leads whose current status is OPEN |
| Paid test orders | Orders in PAID, SHIPPED or DELIVERED status; excludes pending, expired and review cases |
| Confirmed payment total | Sum of those order totals, including shipping; not accounting revenue or real money |
| Seven-day chart | New active conversations by their creation date during the last seven UTC calendar days |
| Most recommended | Number of saved recommendation cards per product, not invented mentions in generated prose |
| Frequent questions | Assistant replies grouped by their recorded policy/FAQ or response topic, including offline/failure topics |
| Estimated AI cost | Sum of recorded conversation cost estimates; interrupted calls may be missing |

Repeated clicks or multiple recommended products within the same conversation do
not increase the conversion numerator. A cart click is not a sale. Browser/network
failures can lose analytics events. These are useful demo indicators, not precise
attribution or accounting reports. The seven-day cleanup remains a phase 6 task.

## Access and privacy

The token is submitted by same-origin POST, compared using constant-time digests,
and exchanged for an opaque HttpOnly, SameSite=Strict cookie. Production cookies
also use Secure, so deployed access requires HTTPS. The database holds only the
session token hash, configured-secret hash and expiry, never the raw credentials.

Sessions expire after eight hours. Sign out deletes the session from Postgres and
clears its cookie. Rotating `ADMIN_TOKEN` and restarting the server invalidates old
sessions on their next request. Expired session rows are pruned when a new session
is created. Every private read and update checks authentication server-side.

Login is limited in Postgres to eight attempts per IP and 100 globally per
15-minute window. Production must use a trusted proxy that overwrites
`x-forwarded-for`. Invalid requests use generic errors. Admin pages and endpoints
are marked no-store, noindex and no-referrer, and deny iframe embedding.

Status updates submit the previously displayed status. If another tab changes the
same request, the stale write receives 409 and asks the owner to refresh. The
dashboard intentionally does not load delivery addresses, payment IDs, request
hashes or customer-session token hashes. It still contains private customer data:
use fictional data for portfolio recordings.

## Verification

```powershell
npm.cmd test
npm.cmd run test:integration
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e -- --workers=2
npm.cmd audit
```

Integration tests use the isolated local `ember_oak_test` database. They cover
access denial, expiry, token rotation, logout revocation, same-origin protection,
login limits, bounded bodies, lead conflicts, distinct conversion counts,
pagination and private-field selection. Component tests cover save feedback.

The authenticated browser test requires local `ADMIN_TOKEN` configuration matching
the running app. It logs in via the request context and never captures traces,
videos or screenshots, because network traces can contain the submitted token.
The normal storefront tests retain their existing failure diagnostics.

Phase 4 verification: 54 unit/component tests, 41 real-Postgres integration tests
and 38 desktop/mobile browser tests passed. Typecheck, lint and production build
passed; npm audit reported zero vulnerabilities. No external service was enabled.
