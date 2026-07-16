# Dashboard Security and Privacy Boundaries

## Browser-safe data

The partner dashboard may display:

- partner identity, status, tier, and onboarding completion
- public-safe lead IDs and business display names
- readiness score, tier, funding family, and next action
- partner-visible lead status
- tracking-link and campaign attribution
- assigned resources and approved widgets
- estimated, verified, and paid commission values with explicit labels
- partner-visible events and notifications

## Restricted data

Never return or store in static dashboard files:

- Social Security numbers or full tax IDs
- bank account, routing, login, or credential values
- uploaded document contents or base64 documents
- identity-document values
- internal underwriting or provider-routing notes
- private provider compensation data
- another partner's records
- Notion tokens, API keys, service-account credentials, or session secrets

## Identity and authorization

- Live dashboard requests use a signed partner session or trusted server request.
- The server derives the authoritative `partner_id`.
- Browser-supplied partner IDs are not authorization.
- Production should prefer HttpOnly signed cookies or a server-side one-time code exchange.
- Query-string dashboard tokens are limited to controlled transition/testing flows and are removed from the visible URL immediately.

## Live-mode controls

- Lead status controls are disabled.
- Lead removal is unavailable.
- Partner identity, status, tier, and verification fields are server-controlled.
- New live lead intake opens Am I Fundable and continues through the canonical `/api/lead-router` workflow.

## Demo-mode controls

- Demo data must be fictional.
- Demo state stays in localStorage.
- Exported JSON is a local workspace export, not a CRM record or funding application.
