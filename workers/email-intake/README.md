# Cloudflare Email Intake Worker

This Worker is the inbound-email transport for Partner Command Center.

## Flow

```text
Forward email
  -> Cloudflare Email Routing
  -> this Email Worker
  -> R2 durable MIME receipt
  -> Cloudflare Queue
  -> POST /api/intake-message
  -> partner or applicant pipeline
```

The Worker stores the original MIME in R2 before sending a small receipt pointer to Cloudflare Queues. It returns from the Email Routing handler only after both durable writes succeed. A queue consumer parses MIME and forwards a normalized message to the existing Vercel API.

## Setup

1. Put the domain on Cloudflare DNS.
2. Enable Email Routing for the domain.
3. From this folder run `npm install`.
4. Store the Partner Command API key as a Worker secret:

```bash
npx wrangler secret put PARTNER_COMMAND_API_KEY
```

5. Deploy:

```bash
npm run deploy
```

6. In Cloudflare Email Routing, create an Email Worker route for an address such as:

```text
intake@yourdomain.com
```

7. Forward a recent partner or applicant notification from your normal email account to that address.

Optional aliases can all target the same Worker:

```text
partners@yourdomain.com
applicants@yourdomain.com
dac@yourdomain.com
funding@yourdomain.com
```

Recipient names are treated as routing signals, but the Vercel endpoint also inspects sender, subject, and body.

## Required Worker configuration

Variable:

```text
INTAKE_API_BASE_URL=https://partner-command-center-rho.vercel.app
```

Secret:

```text
PARTNER_COMMAND_API_KEY
```

## Failure behavior

The queue consumer retries transient Vercel and destination failures with bounded exponential delay. The queue's configured retry limit moves exhausted messages to its dead-letter queue. A five-minute R2 sweep re-enqueues captured receipts if queue submission failed; duplicate queue deliveries use the same stable receipt identity. Receipt status objects in R2 record hashed receipt identity, attempt, outcome, and destination status without applicant PII. Unknown message types remain `review_required`; they are not guessed into a partner or applicant record.

## Durable bindings and provisioning

`wrangler.jsonc` expects these Cloudflare resources:

- R2 bucket `partner-command-email-receipts`
- Queue `partner-command-email-intake`
- Dead-letter queue `partner-command-email-intake-dlq`

They are not provisioned by this repository today. Create them in the account before activating the Worker configuration. Configure lifecycle expiration for both `receipts/` and `receipt-status/` prefixes according to the organization's email retention policy; the proposed activation default is 30 days. Keep the raw MIME object and receipt metadata in the same retention window.

The queue consumer is intentionally serialized (`max_concurrency: 1`, batch size 1) to reduce same-applicant write races across forwarded notifications. The six-hour scheduled reconciliation is also submitted to that queue, so it does not run concurrently with email jobs. Direct calls to Vercel's intake endpoint and an independently started manual reconciliation are outside that queue's serialization boundary; continue to use the endpoint's idempotent upserts and review `409` identity conflicts rather than guessing.

## Activation

Provision the resources before merging the PR. This Worker is connected to Cloudflare Workers Builds from `main`, so a merge can trigger a production deployment immediately. Cloudflare account access is required:

```bash
cd workers/email-intake
npx wrangler r2 bucket create partner-command-email-receipts
npx wrangler r2 bucket lifecycle add partner-command-email-receipts expire-receipts-30d receipts/ --expire-days 30
npx wrangler r2 bucket lifecycle add partner-command-email-receipts expire-status-30d receipt-status/ --expire-days 30
npx wrangler queues create partner-command-email-intake
npx wrangler queues create partner-command-email-intake-dlq
```

Confirm the 30-day lifecycle rules cover both `receipts/` and `receipt-status/`. Before merging, verify `intake@myfunding.site` still routes to this Worker and that `PARTNER_COMMAND_API_KEY` and `INTAKE_API_BASE_URL` are configured. After an authorized merge, let the existing Workers Builds connection deploy from `main`; use `npx wrangler deploy` only if that connection is unavailable and a deployment is separately authorized.

After deployment, check Worker receipt logs, queue depth, DLQ depth, Vercel intake logs, and existing sink records using read-only tools. A controlled new test message will write to the existing CRM destinations and requires separate authorization. Do not replay old mail during activation.


## Git-connected deployment

This Worker is connected to Cloudflare Workers Builds from the `main` branch with root directory `workers/email-intake`. Changes in this directory trigger a production Worker build and deploy when merged to `main`.
