# Partner Classification Rules

## Purpose

Define the Sprint 02 rules used by `/api/router.js` to classify partner signup payloads.

Classification is rules-based in this sprint. No model dependency, no package manager, no mystical CRM horoscope.

## Supported partner types

```text
funding_broker
referral_partner
affiliate_partner
center_of_influence
professional_service_provider
community_connector
internal_operator
unknown
```

## Classification inputs

The router evaluates text from:

- `partner_type_claimed`
- `desired_partner_role`
- `audience`
- `industry`
- `funding_experience`
- `notes`

## Rule order

Rules are evaluated in priority order. Earlier matches win.

| Priority | Partner type | Match signals |
|---:|---|---|
| 1 | `internal_operator` | internal, operator, admin, Moonshine team context. |
| 2 | `funding_broker` | broker, ISO, funding advisor, commercial finance, business funding. |
| 3 | `affiliate_partner` | affiliate, creator, influencer, publisher, newsletter, YouTube, podcast, media. |
| 4 | `center_of_influence` | CPA, bookkeeper, attorney, lawyer, accountant, business broker, advisor. |
| 5 | `professional_service_provider` | consultant, agency, service provider, marketing, ecommerce, real estate, contractor. |
| 6 | `community_connector` | community, veteran, chamber, association, network, connector. |
| 7 | `referral_partner` | refer, referral, clients, network. |
| 8 | `unknown` | Not enough signal. |

## Tier rules

| Tier | Use when |
|---|---|
| `tier_1` | Strong funding broker signal plus meaningful referral volume, existing funding experience, or fast launch timeline. |
| `tier_2` | Moderate volume, clear audience, affiliate/COI fit, or useful professional network. |
| `tier_3` | Valid partner context but lower immediate activation signal. |
| `manual_review` | Unknown partner type, incomplete profile, missing core signal, or restricted/sensitive data risk. |
| `watchlist` | Risky marketing, questionable lead source, misleading claims, or unclear acquisition methods. |
| `reject` | Reserved for later admin decisioning, not automatic Sprint 02 rejection except severe policy concerns. |
| `unknown` | Placeholder only; avoid storing this when better review status is available. |

## Manual review triggers

Manual review is required when:

- Partner type is `unknown`.
- Required contact or audience fields are missing.
- Sensitive or restricted data appears in form text.
- The partner claims unrealistic volume without context.
- The partner mentions scraped lists, bought leads, pressure tactics, or spam-style outreach.
- The partner uses language implying guaranteed funding, approval certainty, credit repair, or guaranteed partner revenue.
- The partner is a strategic/vendor/platform partner with integration implications.

## Classification outputs

The router returns or stores:

```json
{
  "partner_type": "funding_broker",
  "tier": "tier_1",
  "manual_review_required": false
}
```

## Notes

Sprint 02 classification is intentionally conservative. Activation can always be upgraded by an operator later. Bad data, on the other hand, grows mold.