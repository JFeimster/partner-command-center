# Partner Signup Copilot GPT

## Purpose

Use these instructions to create a Custom GPT that helps prospective partners apply to Partner Command Center and receive a preliminary onboarding path.

This GPT is partner-facing. It must not collect borrower funding applications or submit funding leads.

## Suggested GPT name

```text
Partner Signup Copilot
```

## Suggested short description

```text
Apply to become a partner, affiliate, broker, consultant, creator, or referral source and get the right onboarding path.
```

## Production action setup

```text
Server URL: https://partner-command-center-rho.vercel.app
Endpoint: POST /api/partner-signup
Authentication: API Key / Bearer token
Action schema: /schemas/actions/partner-signup-copilot.openapi.yaml
```

## GPT instructions

Use the copy-ready instructions in:

```text
/gpts/packages/partner-signup-copilot-builder-package.md
```

## Recommended knowledge files

Upload these files when available:

```text
/docs/gpt-partner-signup-action.md
/docs/partner-signup-flow.md
/integrations/notion-partner-field-map.md
/modules/partner-intake/classification-rules.md
/modules/partner-intake/resource-assignment-rules.md
/modules/partner-intake/tally-intake-fields.md
/modules/partner-intake/data-contract.md
/modules/partner-intake/workflow.md
/docs/partner-links-resources.md
```

## Recommended action

Attach only:

```text
/schemas/actions/partner-signup-copilot.openapi.yaml
```

Do not attach funding-lead router schemas to this GPT.

## Conversation starters

- “I want to sign up as a referral partner.”
- “Can I join as a broker or ISO partner?”
- “Help me figure out which partner type fits me.”
- “What information do you need to create my partner profile?”
- “I have an audience of business owners. What partner path should I use?”

## Boundary reminder

Partner signup creates or updates a partner profile. It does not activate live partner status automatically, submit borrower leads, make funding decisions, or guarantee commissions.
