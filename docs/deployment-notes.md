# Dashboard Deployment Notes

## Current policy

Partner Command Center uses controlled deployments. `vercel.json` keeps Git deployments disabled for `main` and all other branches.

## Implementation branch

```text
dashboard/fpos-shell-consolidation
```

The branch must remain undeployed until the pull request is reviewed and the release window is explicitly opened.

## Controlled release

1. Merge the approved pull request.
2. Temporarily enable the intended production branch only.
3. Trigger one production deployment.
4. Verify `/dashboard`, `/api/dashboard/bootstrap`, static assets, mobile layout, and live session behavior.
5. Restore `main: false` and `*: false` immediately.
6. Record the production deployment ID in the release PR or issue.

## Rollback

- Roll back to the previous READY production deployment.
- Revert the dashboard consolidation PR when code rollback is required.
- Keep the deployment lock active during diagnosis.

## Standalone FPOS

The standalone `fpos` Vercel project is not the canonical runtime. After the consolidated release is verified, redirect or clearly label that deployment as a visual prototype.
