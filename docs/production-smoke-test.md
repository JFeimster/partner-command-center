# Production Smoke Test

## Static shell

- Open `/dashboard?dashboard_mode=demo`.
- Confirm the seven navigation modules appear.
- Confirm the mobile menu opens, closes, and works at 320px width.
- Confirm Overview, Leads, Tracking Links, Resources, Widgets, Commissions, and Settings render.
- Confirm `data/app-config.json` loads without a console error.
- Confirm no broken CSS, JavaScript, or JSON requests.

## Demo mode

- Add a fictional demo lead and reload.
- Confirm the demo lead remains in localStorage.
- Change a demo lead status.
- Generate and copy a demo tracking link.
- Export demo JSON.
- Reset demo data.
- Confirm privacy copy remains visible.

## Live mode

- Open `/dashboard?dashboard_mode=live` without a valid session and confirm a safe authorization warning.
- Open with a valid signed partner session.
- Confirm the partner profile, onboarding, summary, leads, links, resources, widgets, commissions, notifications, and activity load.
- Confirm lead status fields are disabled.
- Confirm lead removal buttons are absent.
- Confirm profile identity fields are disabled.
- Confirm Submit New Lead opens Am I Fundable with partner attribution.
- Confirm another partner's records are not returned.

## Release controls

- Confirm `vercel.json` still has `main: false` and `*: false`.
- Confirm no preview or production deployment is triggered by the implementation branch.
- Open a controlled release window only after PR approval.
- Verify production, then restore the deployment lock immediately.
