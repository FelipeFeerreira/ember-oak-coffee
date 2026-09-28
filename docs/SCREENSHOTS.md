# Portfolio screenshots

The committed images are local captures of the actual UI with **staged fictional data**.
They are not evidence of customer activity, real payments, a deployed site, or live AI
responses. Chat replies are intercepted for reproducibility and zero provider charges;
product prices and order details are fetched from the running app's database APIs.
The owner dashboard reads a separate local database containing illustrative activity.
See `docs/screenshots/manifest.json` for capture provenance and image sizes.

## Reproduce the local set

Start Docker, install Playwright Chromium, and create a production build:

```bash
npx playwright install chromium
npm run build
npm run screenshots:local
```

The runner creates `ember_oak_capture_test` on your local PostgreSQL server, applies
migrations, loads fictional fixtures, and temporarily starts Next.js on port 3110.
Only this dedicated database is reset by the fixture script. It cannot accept a remote
database or your regular `ember_oak` database. The temporary owner token exists only
in child process memory. Stripe, Resend and Anthropic keys are blanked for the preview.
The process stops its own server after capturing. The capture database remains local
for repeatability, and its fixtures are refreshed on the next run.

Outputs:

- `docs/screenshots/*.webp`: ten optimized images, each smaller than 500,000 bytes.
- `portfolio-assets/upwork/*.png`: nine original captures at `deviceScaleFactor: 2`.
- `portfolio-assets/upwork/cover.png`: a 1600 × 1200 desktop/mobile composition.
- `docs/screenshots/manifest.json`: provenance, mode, dimensions policy and file sizes.

The complete high-resolution folder is ignored by Git. No login screen, trace, video,
HAR, cookie file or browser storage state is recorded. Owner sign-in uses a POST body,
never a URL parameter; the owner session is revoked after its screenshot.

## Capture the deployed site after approval

Use only a dedicated demo with fictional customers. Prepare a paid **test** order via
the signed Stripe flow, and fictional conversations/leads to populate the dashboard.
The local fixture loader intentionally refuses remote databases.

Set these variables privately in the shell running the capture script (or through an
ignored environment file and Node's `--env-file` flag). Do not put a token in the command
line, a captured URL, the README or a committed file:

| Variable | Value |
| --- | --- |
| `SCREENSHOT_BASE_URL` | Clean HTTPS origin of the deployed demo. |
| `SCREENSHOT_ADMIN_TOKEN` | The target deployment's owner token. No implicit reuse of local `ADMIN_TOKEN`. |
| `SCREENSHOT_FICTIONAL_DATA` | `true` only after verifying that the target contains fictional data. |
| `SCREENSHOT_STAGED_CHAT` | `true` for deterministic illustrative replies without AI calls. |
| `SCREENSHOT_ORDER_NUMBER` | Fictional paid test order number to look up. |
| `SCREENSHOT_ORDER_EMAIL` | Matching fictional checkout email. |
| `SCREENSHOT_ALLOW_AI_CALLS` | `true` only with explicit spending approval when staged chat is disabled. |

Then run `npm run screenshots`. For an ignored `.env.capture.local`, use:

```bash
node --env-file=.env.capture.local node_modules/tsx/dist/cli.mjs scripts/screenshots.ts
```

The script captures home, catalog, product, cart, chat recommendations, chat order
lookup, owner metrics, mobile home and mobile chat, then makes the cover. Desktop uses
1440 × 1000 CSS pixels; mobile uses the iPhone 13 profile with scale factor overridden
to 2. Images are captured after fonts and photographs load. The cover is exactly
1600 × 1200; optimized copies may be resized to meet the size budget.

Huila Hearth must exist and be in stock. Live chat captures require provider access and
can fail if replies differ or limits are reached; they are intentionally not a billing
test. Keep the manifest and README disclosures aligned with the selected capture mode.
Visually review every result before sending it to a client. These screenshots overwrite
the previous named set; copy any alternate set into the ignored assets folder first.
