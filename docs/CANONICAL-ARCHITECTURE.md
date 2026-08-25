# Canonical Broker / Agency / Partner Architecture

Status: canonical architecture lock for Issue #25.

## Canonical surfaces

| Surface | Canonical role | Primary owner |
|---|---|---|
| `distilledfunding.com/brokers` | SEO / informational bridge | Wix / Distilled Funding |
| `agency.distilledfunding.com` | Public funding-agency / broker opportunity | Agency property (planned) |
| `capital.distilledfunding.com/<partner-slug>` | Public partner identity, co-branded funding pages, lead capture | `JFeimster/moonshine-capital-portal` |
| `app.distilledfunding.com` | Authenticated Partner Command operating environment | `JFeimster/partner-command-center` |
| `tools.distilledfunding.com` | Canonical public tool/resource inventory | Distilled Funding Tools |

`admin.distilledfunding.com` is reserved for a future Moonshine-only administrative surface. It is not a partner login target.

## Ownership rules

- **Wix** owns search-oriented broker education, acquisition content, FAQs, and the bridge into the Agency property.
- **Agency** owns public recruitment and opportunity education: business model, compensation scenarios, client acquisition, training previews, tools previews, product-desk preview, referral-partner lanes, and application.
- **Capital** owns public partner identity and client-facing conversion: partner profiles, co-branded funding pages, directory/discovery, tracked links, intake, attribution, profile enrichment, status gating, and public rendering.
- **App / Partner Command** owns authenticated operations: dashboard, leads, clients, follow-up, links, campaigns, assets, tools, providers, marketplace, training, commissions, production planning, team, leadership, profile, and settings.
- **Tools** owns canonical public tool/resource discovery. Agency and App federate from it; they do not create competing catalogs.

## User journeys

### Prospect / future broker

```text
search/content
→ distilledfunding.com/brokers
→ agency.distilledfunding.com
→ learn / evaluate / apply
```

### Approved partner

```text
approval
→ app.distilledfunding.com
→ onboarding
→ Partner Command
```

### Partner's prospect

```text
partner shares capital.distilledfunding.com/<partner-slug>
→ public funding page
→ lead capture
→ attribution preserved
→ partner pipeline
```

### Public tools

```text
tools.distilledfunding.com
→ canonical discovery
→ selected metadata / links / embeds federated into Agency and App
```

## Design-system ownership

`JFeimster/moonshine-capital-portal` is the primary future design-system reference for the broker/partner ecosystem. Its visual language should ultimately influence Agency, Capital, Partner Command, and broker tools where appropriate.

Target design DNA:

```text
NEO-BRUTALISM
× CAPITAL COMMAND DESK
× FIELD MANUAL
× TRADING TERMINAL
```

This architecture lock does **not** redesign Partner Command.

## Non-goals of this batch

- No Wix changes.
- No Agency frontend build.
- No Partner Command redesign.
- No donor-repo migration or archival.
- No final `app.` domain assignment.
- No duplicate tool, portal, directory, or partner-OS implementation.

## Canonical conflict rule

One responsibility gets one canonical owner. Donor repos may supply content, UX, components, or ideas, but may not remain competing canonical implementations after their useful material is federated or migrated.
