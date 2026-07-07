# Launch Now Operator Packet

This file exists to stop the wheel-spinning.

## Objective

Get Partner Command Center usable fast:

1. Partner signs up.
2. Partner lands in a clean dashboard experience.
3. Partner can get links/resources.
4. Partner can refer leads.
5. Revenue motion starts.

No more fake completion because code merged.
No 40-step admin maze.

## Current launch branch

```text
qa-launch-wireup
```

## Live Notion database IDs

Do not commit `NOTION_API_KEY` values to the repo.

```env
NOTION_PARTNERS_DB_ID=2484bc1bd63c80a79c3ac809b4308c65
NOTION_PARTNER_EVENTS_DB_ID=2ea21bb9f3f4430f952b6d3d002874de
NOTION_PARTNER_RESOURCES_DB_ID=1f6b5150c60845e1905c2dc7cc0d1d46
NOTION_TRACKING_LINKS_DB_ID=711009b7e9fd4182af423c756950b676
```

## Required Vercel env vars

Set these in Vercel. Do not put secret values in GitHub.

```env
NOTION_API_KEY=<set in Vercel only>
NOTION_PARTNERS_DB_ID=2484bc1bd63c80a79c3ac809b4308c65
NOTION_PARTNER_EVENTS_DB_ID=2ea21bb9f3f4430f952b6d3d002874de
NOTION_PARTNER_RESOURCES_DB_ID=1f6b5150c60845e1905c2dc7cc0d1d46
NOTION_TRACKING_LINKS_DB_ID=711009b7e9fd4182af423c756950b676
PARTNER_COMMAND_API_KEY=<set in Vercel only>
MOONSHINE_TALLY_WEBHOOK_SECRET=<set in Vercel only>
```

## Fast path

### 1. Publish the UI first

Use the existing dashboard shell. Prioritize experience:

- bold landing/welcome screen
- partner ID lookup
- clear next action cards
- referral link builder
- resource cards
- submit lead CTA

The UI should feel like a partner command center, not a database admin panel.

### 2. Wire only the minimum backend

Minimum endpoints that matter:

- `/api/router` for partner intake and activation lookup
- `/api/lead-router` for partner lead submission

Everything else is secondary.

### 3. Use Notion as the cockpit

Notion is the operating CRM. GitHub is source. Vercel is runtime. Browser code must not hold secrets.

## Immediate human actions

These cannot be safely automated from repo code:

1. Add Vercel env vars.
2. Make sure the Notion integration has access to all four databases.
3. Add Tally webhook URL after Vercel env is live.

## What “done” means

A partner can:

1. Fill out the signup form.
2. Get created in Notion.
3. Access the dashboard by email or partner ID.
4. See resources and next actions.
5. Build/use a referral link.
6. Submit a lead.

If that works, ship the pilot. Polish later.
