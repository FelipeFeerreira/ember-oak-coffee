# Checkout and order operations

## What works locally

- The cart opens Stripe-hosted Checkout using prices and stock loaded from Postgres.
- Only signed test-mode Stripe webhooks confirm payment. The return page only reads status.
- A confirmed order and its stock decrease commit together in one database transaction.
- Duplicate webhook deliveries, concurrent deliveries and retrying checkout do not create duplicate orders.
- Confirmation emails use Resend, or print a local preview when its key is absent.
- `/track-order` requires an order number and the email used at checkout.
- Missing Stripe configuration shows a friendly error and preserves the cart.

## Activate Stripe test checkout

Account creation and external service configuration require the project owner's approval.
No account, hosted webhook, production payment or deployment is created by the code.
These are manual instructions for use after that approval.

1. Use a Stripe sandbox/test account. Copy its **test secret key** into `.env.local`
   as `STRIPE_SECRET_KEY`. The application rejects live keys; no publishable key is needed
   because Stripe hosts the entire payment form.
2. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) using the official instructions,
   and authenticate with `stripe login`.
3. Start local forwarding in a separate terminal:

   ```bash
   stripe listen --events checkout.session.completed,checkout.session.expired --forward-to localhost:3100/api/stripe/webhook
   ```

4. Copy that listener's signing secret into `.env.local` as `STRIPE_WEBHOOK_SECRET`.
   The local CLI secret differs from a deployed endpoint's secret. Do not paste secrets into
   chat, screenshots, GitHub issues or committed files.
5. Keep `NEXT_PUBLIC_SITE_URL=http://localhost:3100`. Run migrations with
   `npx prisma migrate deploy`, then restart `npm run dev` after changing environment variables.
6. Add coffee to the cart and choose **Checkout securely**. Use `4242 4242 4242 4242`,
   a future expiry, any three-digit CVC and a US shipping address. Use an email you control.
7. The confirmation page should move from waiting to **Payment confirmed** after the
   signed webhook arrives. Copy the order number and verify tracking with the checkout email.
8. Try a wrong email: the lookup must not return the order. A made-up success URL must
   never mark a pending order as paid.
9. Inspect the Stripe event delivery and use its resend option to repeat the same event.
   Confirm the order and stock have not been duplicated. A generic `stripe trigger` fixture
   does not refer to an application order; use a real test Checkout Session from the cart.

Only card payments are enabled (eligible card wallets are managed by Stripe). Asynchronous
payment methods are intentionally excluded, so `checkout.session.completed` with
`payment_status=paid` is the fulfillment signal. If adding other methods, implement their
success/failure events before enabling them.

Official references: [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create),
[webhook signatures and delivery](https://docs.stripe.com/webhooks).

## Confirmation email

Leave `RESEND_API_KEY` empty for local development. A successful confirmation prints an
`[email:local-preview]` entry in the server terminal, including the recipient and message.
It is a preview, not a delivered email. Use fictional personal data in local tests and do
not publish these logs. Payment processing keeps working without a Resend account.

After approval to configure Resend, set `RESEND_API_KEY` and `RESEND_FROM` in `.env.local`.
The sender must be allowed by the Resend account. A test sender may only send to the
account owner's permitted address; use a verified domain for broader delivery.
No sender/domain is created automatically.

Delivery happens after the payment transaction. If delivery fails, the webhook returns
500 so Stripe can retry. The saved event prevents another stock decrease while email
delivery is retried. A per-order email marker and a stable Resend idempotency key prevent
ordinary retries from sending twice. Resend retains idempotency keys for 24 hours, so
an unusual crash after delivery followed by a retry beyond that window can still duplicate
an email; this is not an exactly-once distributed delivery guarantee.

References: [Resend send API](https://resend.com/docs/api-reference/emails/send-email),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Order states and stock

| State | Meaning |
| --- | --- |
| `PENDING` | Checkout started, no signed paid event confirmed yet |
| `PAID` | Signed paid event accepted; stock decreased in the same transaction |
| `PAYMENT_REVIEW` | Signed payment received, but the full basket no longer fits stock; nothing deducted |
| `EXPIRED` | Stripe reported an expired unpaid checkout |
| `SHIPPED` / `DELIVERED` | Reserved for future owner-managed fulfillment; never advanced automatically |

Stock is checked at checkout and again when payment completes. It is not reserved while
someone fills in the payment form. Competing buyers can therefore produce a
`PAYMENT_REVIEW` order. Its confirmation page and email explicitly explain the issue and
ask the customer not to pay again. A future owner workflow must resolve it manually;
there is no automatic refund, replenishment or shipping integration in this demo.
Before using this project for a real store, add inventory reservations or an operational
review/refund workflow. No real order is fulfilled by this portfolio concept.

## Privacy, limits and retries

- Tracking credentials travel in a POST body, not query parameters. Both must match.
- Responses exclude the email, shipping address, Stripe identifiers and internal fields.
- The confirmation URL contains an unguessable Stripe Session ID. Treat it as a private
  receipt link; confirmation pages send a `no-referrer` policy and are not indexed.
- Order APIs send `Cache-Control: no-store`. The browser does not cache credentials.
- Checkout is limited to 15 requests per IP per 15 minutes; tracking to 10. Counters live
  in Postgres, so separate server instances share them. IPs are hashed before storage.
- The IP header must be overwritten by a trusted reverse proxy. The intended deployment
  is Vercel; do not expose the Node server directly and trust arbitrary forwarded headers.
- Request bodies have size limits. Checkout and lookup reject cross-origin form submissions.
- The browser reuses a checkout attempt key for retries of an unchanged cart. A changed
  basket creates a new attempt. The server binds that key to an immutable order snapshot.
- Stripe sessions expire after one hour. An interrupted session creation is retried with
  identical parameters and the same Stripe idempotency key; an old attempt asks the user
  to start again before Stripe's creation-time limits are exceeded.
- A paid receipt clears the cart only if it still matches that checkout attempt. Items
  changed in another tab are preserved. Cancelled/expired checkouts do not clear the cart.

## Automated checks

```bash
npm test
npm run test:integration
npm run test:e2e
npm run typecheck
npm run lint
npm run build
npm audit
```

The integration runner uses `TEST_DATABASE_URL` (default local `ember_oak_test`), refuses
remote databases and non-`_test` names, and applies migrations automatically. It never
uses development stock. Stripe signatures are generated and verified by the actual SDK;
outbound payment and email APIs are mocked. Tests cover repeated/concurrent events,
database rollback, last-unit competition, amount mismatches, unpaid/live events, email
retries, server prices, private lookups and database-backed rate limiting.

The hosted Stripe payment and real Resend delivery remain manual activation checks
until the owner supplies test credentials and authorizes the external configuration.
