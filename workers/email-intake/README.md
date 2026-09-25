# Cloudflare Email Intake Worker

This Worker is the inbound-email transport for Partner Command Center.

## Flow

```text
Forward email
  -> Cloudflare Email Routing
  -> this Email Worker
  -> POST /api/intake-message
  -> partner or applicant pipeline
```

The Worker intentionally does not own business logic. It parses MIME and forwards a normalized message to the Vercel API.

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

If the Vercel intake endpoint returns a non-2xx response, the Worker throws instead of silently treating the message as processed. Unknown message types are accepted by the API as `review_required`; they are not guessed into a partner or applicant record.
