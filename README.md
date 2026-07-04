# Moonshine Capital Partner Command Center

A static, deploy-ready partner dashboard for Moonshine Capital brokers, referral partners, and affiliate operators.

This version is intentionally static-first:

- No backend
- No database
- No authentication
- No API keys
- No payment processor
- Browser `localStorage` only

## Files

```text
moonshine-partner-command-center/
  dashboard.html
  dashboard.css
  dashboard.js
  index.html
  README.md
```

## What works

- Dark fintech command-center dashboard
- Fixed desktop sidebar and mobile drawer navigation
- Partner path selector:
  - Direct Broker
  - Affiliate Partner
  - Hybrid Partner
- localStorage profile save/load
- localStorage onboarding checklist and progress
- localStorage lead submission form
- searchable/filterable lead tracker
- lead status update, next step update, delete action
- partner links manager with copy/open/delete
- training hub with status and local notes
- notes / CRM lite
- commission snapshot placeholders
- export local data as JSON
- import local data from JSON
- light/dark theme preference
- compliance and local data disclaimers

## Local use

Open `dashboard.html` in a browser.

No install step is required.

## Deploy to Vercel

1. Create a GitHub repo.
2. Upload these files to the repo root.
3. Import the repo into Vercel.
4. Framework preset: **Other**.
5. Build command: leave blank.
6. Output directory: leave blank / root.
7. Deploy.

## Important compliance note

This dashboard is for educational, organizational, and local tracking purposes only. It does not guarantee loan approval, funding, commissions, partner acceptance, or specific financial outcomes.

Data entered into this static version is stored locally in the user's browser. Do not enter sensitive personal information unless the tool is connected to secure infrastructure with appropriate data handling safeguards.

## Suggested backend upgrade later

When ready, upgrade this static prototype into:

- Next.js App Router
- Supabase or Firebase auth
- secured lead tables
- role-based admin/partner views
- server-side validation
- email notifications
- audit trails
- encrypted storage for sensitive data
