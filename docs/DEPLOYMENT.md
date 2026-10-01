# Deployment: Vercel + Neon

Status: the [public repository](https://github.com/FelipeFeerreira/ember-oak-coffee)
contains the complete approved history on `main`. Its description, topics and live
site URL are set. The owner authorized publication and continued setup on September 28,
2026. Vercel deployment and the Neon database are active; the catalog has been seeded.
Optional provider activation (Stripe, Anthropic, Resend) remains pending approval.
The first push was completed after the history review and owner authorization.

## 1. Prepare the approved repository

Run the commands in [TESTING.md](TESTING.md), then inspect `git status` and
`git log --oneline --all`. Approve the phase before merging:

```bash
git switch main
git merge --no-ff chore/deploy-portfolio
gh auth status
```

GitHub CLI is authenticated and the repository below already exists. These commands
document the initial setup; do not create a duplicate repository:

```bash
gh repo create ember-oak-coffee --public --source=. --remote=origin --description "A specialty coffee storefront with secure test checkout and an AI shopping assistant."
```

After first-push approval: `git push -u origin main`.
For GitHub Desktop, follow [PROJECT_PLAN.md](PROJECT_PLAN.md#github-publication).
Do not publish `.env.local`, database dumps or `portfolio-assets/`.

## 2. Create a dedicated Neon demo database

After approval, select the **Free** plan, create a project near the intended Vercel
region, and keep it dedicated to this fictional demo. Check the current
[Neon plan limits](https://neon.com/docs/introduction/plans) before proceeding;
do not enable a paid upgrade without approval.

Copy both connection strings from **Connect**: pooled for `DATABASE_URL`, direct for
`DIRECT_URL`. Preserve the supplied TLS parameters. The application uses the `pg`
adapter in the Node.js runtime. The Prisma CLI reads the direct URL from
`prisma.config.ts`; locally it falls back to `DATABASE_URL`.
See [Neon's Prisma connection guide](https://neon.com/docs/guides/prisma).

Use a separate ignored `.env.deploy.local` for the approved database credentials,
so the normal `.env.local` continues to point to Docker. Put only `DATABASE_URL`
and `DIRECT_URL` in this file, then run these commands once against the empty demo DB:

```bash
node --env-file=.env.deploy.local node_modules/prisma/build/index.js migrate deploy
node --env-file=.env.deploy.local node_modules/prisma/build/index.js db seed
```

Existing process environment variables take precedence: use a fresh terminal and
verify the database hostname/name printed by Prisma before proceeding. Never run
`migrate reset`, screenshot seeding or the test suite against Neon. Re-running the
catalog seed resets prices and stock; it is an intentional initialization step.

## 3. Import into Vercel

After deployment approval, import the approved GitHub repository. Select **Next.js**,
root `.`, Node.js **24.x**, install `npm ci`, build `npm run build`. Keep migrations
out of every build: deploy approved schema changes explicitly before code that needs
them. Pick a plan suitable for your use and confirm pricing before accepting it.

Set the production branch to `main`. The
[Vercel GitHub integration](https://vercel.com/docs/git/vercel-for-github) deploys pushes;
branch previews must use a separate database and separate credentials. Never copy
production database access into untrusted previews. Confirm the intended production
domain and configure the following variables in **Settings → Environment Variables**
before the first usable deployment. Redeploy after changes. See
[environment scopes](https://vercel.com/docs/environment-variables).

| Variable | Production value / purpose |
| --- | --- |
| `DATABASE_URL` | Secret pooled Neon URL. Required by runtime queries. |
| `DIRECT_URL` | Secret direct Neon URL for migration commands; optional in Vercel when migrations run only from the approved local deployment file. |
| `NEXT_PUBLIC_SITE_URL` | Public canonical HTTPS origin, without a trailing path; used for checkout redirects and metadata. |
| `ADMIN_TOKEN` | New independent random 32–256 character owner secret; never `NEXT_PUBLIC_*`, never in URLs. Rotation revokes old sessions. |
| `DEMO_MODE` | `true` only for this disposable database; enables permanent seven-day cleanup and daily stock reset. Otherwise `false`. |
| `CRON_SECRET` | Independent random secret of at least 32 characters. Required for scheduled cleanup. |
| `STRIPE_SECRET_KEY` | Optional `sk_test_...`; blank disables checkout until approved setup. Live keys are rejected. |
| `STRIPE_WEBHOOK_SECRET` | Optional signing secret for this deployment's Stripe test webhook; not the local CLI listener secret. Needed with the Stripe key. |
| `ANTHROPIC_API_KEY` | Optional; blank keeps the friendly offline assistant. Enable only after spending approval and a monthly Anthropic Console spending limit. |
| `RESEND_API_KEY` | Optional; blank logs the confirmation email instead of sending it. Use only fictional customer details in this demo, including logs. |
| `RESEND_FROM` | Approved verified sender; default `Ember & Oak <onboarding@resend.dev>` is a development fallback, not a production sender setup. |

`TEST_DATABASE_URL` is local-only and must end in `_test`; do not set it on Vercel.
`E2E_BASE_URL` is an optional browser-test runner override. Screenshot-only variables
are documented in [SCREENSHOTS.md](SCREENSHOTS.md); none belongs in Vercel.
Vercel supplies `NODE_ENV`; do not override it. Keep secrets out of shell arguments,
screenshots, support messages and source control. Use your password manager to generate
and transfer the two independent secrets into the service's private settings.

## 4. Activate optional services, after approval

Stripe: use test mode and register `https://YOUR-DOMAIN/api/stripe/webhook` for
`checkout.session.completed` and `checkout.session.expired`. Install its signing
secret in Vercel, then redeploy. Complete a hosted test checkout with card
`4242 4242 4242 4242`, a future expiration and any valid CVC. Verify one paid order,
one stock decrease and a confirmation page. Re-send the event and verify that the
order and stock are unchanged. See [CHECKOUT.md](CHECKOUT.md).

Anthropic: **set a monthly spending limit in the Anthropic Console before going public**,
then configure the key only after approval. The application also limits request rate,
session length, history, output and daily admissions. These are not a replacement for
provider spending controls. Check product recommendations, order privacy, off-topic
refusals and the human support form. See [CHAT.md](CHAT.md).

Resend: configuring a sender/domain or sending billable email requires approval.
If omitted, the checkout continues working and logs the message.

## 5. Verify the daily cleanup

`vercel.json` schedules `/api/cron/demo-cleanup` at `0 5 * * *` (05:00 UTC).
Vercel supplies `Authorization: Bearer CRON_SECRET`; requests without a matching
secret receive 401. With demo mode disabled, authenticated requests do nothing.
The endpoint also refuses a configured non-test Stripe key. See
[securing cron invocations](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

A database transaction deletes orders, leads and conversations created **strictly
before** seven days ago. Related order items, event receipts, messages and recommendation
records cascade; a newer lead survives with its old conversation link cleared.
Expired owner sessions and rate limits are removed. Only known catalog products have
their stock restored; prices and custom products remain unchanged. A UTC-day marker
prevents retries and concurrent calls from replenishing stock a second time.
Failures roll back both the data changes and marker, permitting a safe retry.

This is demo housekeeping, not inventory management for a real merchant. Old orders
and their webhook receipts become unavailable after deletion. Stop demo cleanup and
design a durable order retention policy before adapting the application to real sales.
The retained record count and conversion statistics will change after cleanup.

Check **Settings → Cron Jobs** and function logs after deployment. Test first against
fictional records in the dedicated database; manual execution really deletes old data.
The daily schedule fits the documented Hobby frequency restriction, but timing is not
minute-exact on that plan. Check [current cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
If a run fails, inspect the cause and retry; do not assume automatic retries.

## 6. Finish the portfolio

Capture the approved deployed demo with [SCREENSHOTS.md](SCREENSHOTS.md). Replace the
README live-demo placeholder with its real URL; record the video and replace its TODO.
After approval, update the repository's About panel, or run:

```bash
gh repo edit --description "A specialty coffee storefront with secure test checkout and an AI shopping assistant." --homepage https://YOUR-DOMAIN --add-topic nextjs --add-topic typescript --add-topic ecommerce --add-topic stripe --add-topic ai-chatbot --add-topic claude --add-topic prisma --add-topic postgresql
```

Review `git status`, `git log --oneline --all`, the secret scan and ignored asset paths
before the approved final merge/push. Confirm a push to `main` produces the expected
deployment. Record the live URL in the project handoff once hosting is configured.
The repository URL is https://github.com/FelipeFeerreira/ember-oak-coffee.
