# Partner Signup Copilot GPT

## Purpose

Use these instructions to create a Custom GPT that helps prospective partners apply to Partner Command Center and receive a preliminary onboarding path.

This GPT is partner-facing. It must not collect borrower funding applications or submit funding leads.

## Published GPT

```text
https://chatgpt.com/g/g-6a590d96d96081919ef39a52a68d222a-partner-signup-copilot
```

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

- `/docs/gpt-partner-signup-action.md`
- `/docs/partner-signup-flow.md`
- `/integrations/notion-partner-field-map.md`
- `/modules/partner-intake/classification-rules.md`
- `/modules/partner-intake/resource-assignment-rules.md`
- `/modules/partner-intake/tally-intake-fields.md`
- `/modules/partner-intake/data-contract.md`
- `/modules/partner-intake/workflow.md`

## Recommended action

Use:

```text
/schemas/actions/partner-signup-copilot.openapi.yaml
```

Authentication:

```text
API Key / Bearer token using PARTNER_COMMAND_API_KEY
```

Do not attach borrower lead-router actions to this GPT.