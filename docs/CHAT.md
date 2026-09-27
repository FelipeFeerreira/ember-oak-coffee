# AI coffee guide

## What customers can do

Open **Coffee chat** on any page to ask for coffee recommendations, brewing guidance,
store policies or an order status. Recommendations include an image, product link,
database price and an Add to cart button. Coffee added directly from chat is whole bean;
the product page offers the other grind choices.

To look up an order, supply its full number and checkout email together in one message.
Only an exact match returns a status. The response excludes email, address and payment
identifiers. The normal Track your order page is also linked from the widget.

**Talk to a human** collects a name, email, question and explicit consent to save them.
It stores a lead with status `OPEN`, independently of the model. This portfolio demo does
not promise or send a real human response. The owner dashboard is the next phase.

## Local setup and offline mode

1. Start Postgres with `npm run db:up`, then apply migrations with `npx prisma migrate deploy`.
2. Run `npm run dev` and open `http://localhost:3100`.
3. Open Coffee chat. Leaving `ANTHROPIC_API_KEY` empty shows a friendly offline explanation.
   Browsing, the FAQ, order tracking and saving a support request still work.
4. After the owner approves external configuration, put the Anthropic key in `.env.local`
   and restart the server. Never put it in a `NEXT_PUBLIC_` variable or commit it.
5. Set a monthly spending limit in the Anthropic Console before enabling a public demo.
   No account or paid call was created during implementation.

The model is pinned to `claude-haiku-4-5-20251001`, the current Haiku model verified against
the [official model list](https://platform.claude.com/docs/en/models/overview). The SDK
version was checked on npm before installation: `@anthropic-ai/sdk` 0.128.0.

## How the AI works

The server sends the store's FAQ/policies and a bounded conversation history to Claude.
Claude selects **one** tool per message:

| Tool | Data and behavior |
| --- | --- |
| `search_products(filters)` | Up to three in-stock products, filtered by name, type, roast, brew method, acidity or budget |
| `get_product(id)` | A current database product, including price and stock |
| `get_order_status(order_number, email)` | Private lookup only when both exact credentials appear in the current customer message and match the database |
| `answer_store_question(id)` | A verified FAQ/policy answer from `src/content/store-info.ts` |
| `respond(kind)` | A bounded greeting, clarification, off-topic refusal, request for credentials or human handoff |

Tool inputs pass strict Zod schemas. The browser cannot supply a system message, model
history, product price, conversation ID or tool result. The model cannot call arbitrary
functions, issue refunds, modify stock, send emails or approve discounts.

### Verified response streaming

The server uses the Anthropic streaming SDK and waits for a complete, validated tool
selection. A newline-delimited JSON response streams status and verified text, then the
product/order cards. No artificial typing delays are added. Model-authored prose is never
rendered: it could contain invented prices or unauthorized policy promises, even if the
system prompt asked it not to. Tool outputs and repository-owned copy are shown directly.

This is a deliberate trade-off: natural-language intent recognition is flexible, while
the answer wording stays within approved sources. A completely free-form coffee question
outside the knowledge base offers human help instead of an invented answer. The customer
waits for the tool selection before seeing the answer. More verified coffee knowledge can
be added to the same FAQ file as the business grows.

The system prompt restricts scope to coffee and this store and treats customer text as
untrusted data. A small early filter also declines obvious instruction-replacement
attempts. That filter is only an extra layer; constrained rendering, validated tools and
database authorization enforce the important guarantees. The model can still choose an
irrelevant permitted tool, so real-provider quality evaluation remains necessary.

## Privacy and persistence

- A random 256-bit token is stored in an HttpOnly, SameSite=Strict cookie, Secure in
  production. Only its hash is saved in Postgres. A session expires after 24 hours.
- Conversations and transcripts stay server-side. The client never sends historical roles
  or selects another conversation by ID. Reopening the widget restores its own history.
- Emails are redacted in stored chat text. The current raw message, including credentials
  the customer typed, may be sent to Anthropic when enabled; the widget discloses this.
  Lead form data is saved separately and is not sent to the model.
- Order credentials must be supplied together in the current turn. They are not guessed
  or recovered from old transcripts. Order cards are not persisted in chat history; use
  the lookup again to refresh a status.
- Reopened product cards are reloaded from Postgres, so stored recommendations cannot
  silently preserve an outdated catalog price.
- A database lease permits one active turn per conversation, expires after a crashed
  request, and is released only by its owner. Duplicate client request IDs are rejected.
- A recommendation's add-to-cart event belongs to its message and session. It is recorded
  once and does not interfere with the cart if analytics fail. These are demo interaction
  metrics, not payment attribution or evidence that an order was placed.
- All chat endpoints require same-origin requests and return non-cacheable responses.
- Use fictional personal data in this portfolio. Seven-day demo retention/cleanup is
  scheduled for phase 6; it is not active yet.

## Limits and cost controls

| Control | Limit |
| --- | --- |
| Customer message | 1,000 characters |
| Conversation | 20 accepted messages per 24-hour session |
| History sent to Claude | Last 10 messages, each capped at 2,000 text characters |
| Model output | 400 tokens; one tool selection, no second generation |
| IP message limit | 30 attempts per 15 minutes across sessions |
| New sessions | 10 per IP per hour |
| Human requests | 5 per IP per hour |
| Global demo allowance | 250 admitted AI attempts per UTC date |
| SDK timeout/retries | 20 seconds, zero automatic retries |

Counters are atomic Postgres upserts, shared across serverless instances. Session quotas
and leases also live in Postgres. The forwarding-IP header must be overwritten by the
trusted hosting proxy; do not expose the app directly and trust arbitrary client headers.
The global cap intentionally counts attempts conservatively, including some rejected
turns. It limits calls, not dollars; use the provider's spending controls as well.

The static system prompt has an ephemeral cache marker. Haiku 4.5 currently requires at
least 4,096 tokens in the cacheable prefix. Shorter prompts still run but do not cache;
we do not pad the prompt just to reach that threshold. See the
[official caching guide](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).

Cost estimates and assumptions are in [DECISIONS.md](../DECISIONS.md). Completed responses
record an estimated cost in micro-US dollars on the conversation. Failed/interrupted
provider requests may still be billed and are not fully captured by this estimate.

## Validation

```bash
npm test
npm run test:integration
npm run test:e2e
npm run typecheck
npm run lint
npm run build
npm audit
```

Unit tests mock Claude and challenge invented prices/policies, forbidden tools, truncated
responses, instruction injection, credential guessing, missing keys and bounded requests.
Postgres tests cover session isolation, concurrent turns, quota enforcement, lead consent,
idempotent lead/conversion records and provider failure recovery. One test renders the
real product-card component with a real database price while the mocked model supplies
a conflicting price; only the database value is shown.

Desktop/mobile E2E checks cover opening/closing, keyboard focus, streamed responses,
recommendations, cart additions, order cards, offline handoff, message caps and errors.
Provider responses are intercepted in browser tests and mocked in server tests. No API
credits are spent. After activation, manually evaluate real recommendations, natural
questions and adversarial requests before publishing the demo.
