# Frictionless partner onboarding

This local implementation keeps Partner Command Center as the authority for partner identity, authentication, memberships, referral attribution, and public microsite gating.

## New journey

1. A signed Tally `rjM6do` Join submission is validated for name, email, form identity, and affirmative contact consent.
2. The canonical relay inserts or replays one `partner_applications` row by organization, source, and submission ID.
3. The local migration auto-enrolls a new or safely matched active partner, records `application_auto_approved`, and leaves the profile in `draft`.
4. After Supabase Auth verifies the email, the callback calls `claim_partner_portal_access`. The existing RPC enforces active status, organization scope, ambiguity checks, and suspension protection.
5. The partner lands on `/dashboard/onboarding`, where profile editing, tools/referrals, and the optional `A7edqy` launch plan are available in any order.

`mOe658` remains accepted for legacy reconciliation. Legacy submissions without the normalized consent answer remain in the existing operator queue and are not auto-enrolled.

## Security and publication boundaries

- No user metadata is used for authorization.
- Paused, terminated, ambiguous, or conflicting identities remain protected for operator review.
- Profile completion is not access approval, and enrollment approval is not funding approval.
- No public microsite mapping is created by onboarding; verified tenant mapping and canonical tracking-link checks remain separate gates.
- Existing funding application forms (`dWvEqN`, `w4R2Ad`) remain separate from partner enrollment.

## External release checklist (not performed in this batch)

- Apply the new PCC migration after review and run the migration contract tests.
- Confirm the deployed Tally webhook forwards `consent_to_contact: true` for `rjM6do` and retains its existing signature verification.
- Point the primary thank-you/redirect experience to the existing verified PCC sign-in route. Keep `9qjWEE` for profile enrichment, `A7edqy` optional, and `mOe658` live during transition.
- Do not bulk-reconcile QA fixtures or modify Notion, Tally, Supabase production data, DNS, or Vercel in this development batch.
