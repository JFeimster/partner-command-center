# Federation Map

Issue #25 federation contract. The goal is one canonical owner per responsibility, with Partner Command composing external capabilities rather than copying them.

## Core boundaries

```text
partner-command-center
← partner identity/profile configuration
→ moonshine-capital-portal
```

- Partner Command: authenticated editing/configuration, operational context.
- Capital: public rendering, canonical slug, publication status, tracked public CTA behavior.

```text
partner-command-center
← tool metadata / links / embeds
→ tools.distilledfunding.com
```

- Tools is the public catalog/source of truth.
- Partner Command consumes approved metadata, links, and embeds.

```text
partner-command-center
← widget inventory
→ Embed-Widgets
```

- `Embed-Widgets` owns standalone widget implementations where they already exist.
- Partner Command surfaces/configures approved widgets rather than forking them by default.

```text
partner-command-center
← compensation
→ DAC-pay
```

- `DAC-pay` is a federated compensation/pay-plan capability.
- Partner Command presents operational access and context; it should not create a competing compensation engine without an explicit migration decision.

```text
partner-command-center
← production planning
→ dac-goal-calculator
```

- Goal/production calculations remain federated until intentionally consolidated.

```text
partner-command-center
← follow-up
→ broker-followup-machine
```

- Follow-up automation remains a service/tool boundary until a deliberate API-level integration or migration is approved.

## Additional federated candidates

- `brokerflow-ai` — AI broker workflow/service donor.
- `EliteBroker-AI` — AI capability donor/service.
- `tracking-link-generator` — link-generation service/tool donor.
- `affiliate-launch-kit-generator` — partner launch/distribution tool donor.

## Contract principles

1. **Link/embed/API before copy.** Prefer consuming an existing stable interface over duplicating implementation.
2. **Capital owns public identity.** Partner Command may edit profile configuration but does not become the public profile renderer.
3. **Tools owns catalog truth.** Agency/App may curate subsets and previews but should not fork the registry.
4. **Attribution crosses boundaries.** Partner ID, referral code, source, campaign and UTM values must survive handoffs.
5. **Status authority stays explicit.** Public publication gating belongs to Capital; authenticated operational state belongs to Partner Command.
6. **Design can be shared without ownership confusion.** `moonshine-capital-portal` is the design-system reference, not the authenticated OS.
7. **Retire only after parity.** Donor/competing repos are not deleted or archived in this batch.

## Planned integration seam: Partner Command ↔ Capital

Minimum shared identity envelope:

```json
{
  "partner_id": "...",
  "referral_code": "...",
  "slug": "...",
  "display_name": "...",
  "company_name": "...",
  "photo_url": "...",
  "bio": "...",
  "specialties": [],
  "markets": [],
  "booking_url": "...",
  "profile_status": "...",
  "approval_status": "..."
}
```

Capital remains authoritative for slug/publication and public rendering. Partner Command becomes the authenticated configuration/operator surface.
