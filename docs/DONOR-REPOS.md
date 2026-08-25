# Donor / Federated Repository Classification

Issue #25 working classification. This is an ownership map, not an archival action.

## Canonical

- `partner-command-center` — authenticated Partner Command / Partner OS.
- `moonshine-capital-portal` — public partner identity, co-branded funding pages, directory, intake, tracking and publication gating.

## Design donors

- `fpos`
- `funding-partners-os-dashboard`

Use for visual composition, dashboard interaction patterns, and premium presentation ideas. They are not canonical operating systems.

## Content / UX donors

- `funding-partners-os`
- `moonshine-broker`
- `start-your-agency`
- `Agency-in-a-Box`
- `agency-lab`
- `Onboarding`
- `partner-onboarding`
- `7-steps-launchpad`

Use for recruitment copy, onboarding flows, training UX, product/provider content, marketplace/resource groupings, and launch sequencing where useful.

## Federated tools / services

- `DAC-pay` — compensation/pay-plan capability.
- `dac-goal-calculator` — production and income planning.
- `broker-followup-machine` — follow-up workflow capability.
- `brokerflow-ai` — broker AI capability.
- `EliteBroker-AI` — broker AI capability.
- `Embed-Widgets` — embeddable widgets.
- `tracking-link-generator` — tracked/referral link tooling.
- `affiliate-launch-kit-generator` — distribution/launch kit tooling.

Partner Command should consume these through links, embeds, metadata or APIs when practical instead of cloning implementations.

## Merge / retire candidates

Any repository that currently presents itself as a general-purpose broker/partner OS, portal, or dashboard while duplicating the canonical responsibilities above is a candidate for eventual merge, redirect, read-only donor status, or archive **after useful content and functionality are accounted for**.

Known review candidates include:

- `funding-partners-os`
- `funding-partners-os-dashboard`
- `fpos`
- `moonshine-broker`
- `start-your-agency`
- `Agency-in-a-Box`
- `agency-lab`
- onboarding/launchpad variants that duplicate the eventual Partner Command onboarding runtime

## Retirement rule

Do not delete or archive based on naming alone. Before retirement:

1. inventory unique routes/data/components/content;
2. identify canonical destination or federation seam;
3. migrate or preserve useful material;
4. confirm production/domain dependencies;
5. establish parity or an intentional replacement;
6. then redirect/archive in a controlled batch.

No destructive archival work is authorized by this document.
