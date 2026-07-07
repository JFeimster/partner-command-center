# Notion Environment Variables

## Purpose

Define the server-side environment variables needed for the Notion Partner CRM layer and the future unified API router.

Do not expose these values in browser JavaScript.

## Required variables

| Variable | Required in Sprint 01? | Required by | Purpose |
|---|---:|---|---|
| `NOTION_API_KEY` | Yes | Server-side Notion helpers | Secret token for the Notion integration. |
| `NOTION_PARTNERS_DB_ID` | Yes | Partner CRM | Database ID for the `Partners` database. |
| `NOTION_PARTNER_EVENTS_DB_ID` | Yes | Partner events | Database ID for the `Partner Events` database. |
| `NOTION_PARTNER_RESOURCES_DB_ID` | Yes | Partner resources | Database ID for the `Partner Resources` database. |
| `NOTION_TRACKING_LINKS_DB_ID` | Yes | Tracking links | Database ID for the `Tracking Links` database. |
| `PARTNER_COMMAND_API_KEY` | Reserved | Sprint 02 router/admin calls | API key for trusted manual/admin API requests. |
| `TALLY_WEBHOOK_SECRET` | Reserved | Sprint 02 Tally webhook | Secret used to validate Tally webhook requests. |

## Local development example

Use a local `.env` file only if your runtime loads it securely. Do not commit it.

```text
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PARTNERS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PARTNER_EVENTS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PARTNER_RESOURCES_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_TRACKING_LINKS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PARTNER_COMMAND_API_KEY=replace_with_strong_random_value
TALLY_WEBHOOK_SECRET=replace_with_tally_webhook_secret
```

## Vercel setup checklist

1. Open the Vercel project settings.
2. Go to Environment Variables.
3. Add each required variable.
4. Scope variables to the environments you plan to test.
5. Keep Preview and Production behavior aligned with your deployment gate strategy.
6. Redeploy only when ready for the live test window.

## Security rules

- Do not put these values in `window.MoonshineOS`.
- Do not put these values in `/dashboard/*.js`.
- Do not put these values in `/scripts/*.js`.
- Do not put these values in JSON files served to the browser.
- Do not paste them into Notion docs or GitHub issues.
- Do not print full tokens in API error messages.
- Do not log request headers wholesale.

## Runtime validation

`lib/notion-client.js` should fail fast when required Notion environment variables are missing.

Expected missing-env error shape for future API usage:

```json
{
  "ok": false,
  "error": {
    "code": "missing_env",
    "message": "Missing required server environment variable.",
    "field": "NOTION_API_KEY"
  }
}
```

## Database ID notes

Notion database IDs may appear with or without hyphens. Use the ID exactly as copied from Notion or normalized by your own deployment process.

The helper code treats IDs as opaque strings. No cosmic numerology. No decoding rituals. Just pass the ID.

## Rotation notes

Rotate `NOTION_API_KEY` if:

- It was pasted into a public repo.
- It appeared in client-side JavaScript.
- It appeared in logs.
- A collaborator leaves and no longer needs access.
- The Notion integration permissions change materially.

After rotation:

1. Update `NOTION_API_KEY` in the server environment.
2. Confirm the integration is still shared with all four databases.
3. Run a server-side smoke test.
4. Confirm browser bundles do not include the token.