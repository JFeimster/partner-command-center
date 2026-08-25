# Partner Command Design System

Status: canonical visual contract for Track B.

Primary source of truth:
`JFeimster/moonshine-capital-portal`.

## Design direction

NEO-BRUTALISM × CAPITAL COMMAND DESK × FIELD MANUAL × TRADING TERMINAL ×
HIGH-END FINTECH OPERATIONS

## Colors

| Token | Value | Use |
| --- | --- | --- |
| `--neo-black` | `#0a0a0a` | Primary background / ink |
| `--neo-white` | `#f4f4f0` | Primary text / hard contrast |
| `--neo-cream` | `#e8e8e3` | Light surfaces |
| `--neo-yellow` | `#facc15` | Primary command accent / CTA |
| `--neo-blue` | `#3b82f6` | Informational state |
| `--neo-green` | `#84cc16` | Success / active / funded |
| `--neo-orange` | `#f97316` | Warning / follow-up |
| `--neo-red` | `#ef4444` | Error / blocked / decline |

Accent colors are semantic. Yellow is the default action accent.
Do not decorate every panel with status colors.

## Typography

- Primary UI: Inter/system sans.
- Operational headings: condensed sans stack via `--font-condensed`.
- Metadata, statuses, IDs, filters, nav labels, and compact controls: `--font-mono`.
- Headings are dense, uppercase where operationally useful, with aggressive hierarchy.
- Metadata should be quieter than the action or decision it supports.

## Borders

- Primary structural dividers: `2px solid`.
- Secondary rows: `1–2px` depending on density.
- Hard square corners are the default.
- Rounded SaaS cards are prohibited in the primary command surfaces.

## Shadows

Canonical shadows mirror the Moonshine portal:

- Standard: `4px 4px 0 #000`.
- Large: `8px 8px 0 #000`.
- On black surfaces, white hard shadow may be used for high-priority controls.
- Never use soft glassmorphism shadows for the command shell.

## Buttons

Primary action:

- yellow background;
- black text;
- 2px black border;
- hard white/black offset shadow;
- uppercase mono utility label.

Secondary action:

- black/dark background;
- white border/text;
- hard shadow only when emphasis is warranted.

Interaction:

- hover: slight negative translation;
- active: translate into shadow and remove shadow;
- visible keyboard focus using yellow ring.

## Inputs

- square corners;
- 2px border;
- dark field background;
- mono/utility labels;
- yellow focus state;
- no ornamental gradients.

## Status tags

Status tags are compact, uppercase, mono, square, and bordered.

Use deliberately:

- green: success / funded / active;
- yellow: attention / pending action;
- blue: informational;
- red: blocked / failed / declined.

## Panels

Use panels when content needs a defined operational
boundary. Do not make every datum a card.

Prefer:

1. tables for records;
2. rows for actions;
3. strips for statuses / alerts;
4. panels for grouped operating context;
5. cards only for modules that genuinely behave like a self-contained object.

## Tables and lists

- hard row dividers;
- compact vertical rhythm;
- uppercase mono column labels;
- status tags embedded in rows;
- row-level action aligned consistently at the end;
- no unnecessary card wrapper around a table.

## Spacing

The spacing scale remains 4px-based (`--space-1` through `--space-24`).

Command surfaces prioritize density over decorative whitespace.
Large whitespace is reserved for major hierarchy changes,
not between every data point.

## Navigation

Canonical IA target:

```text
COMMAND
PIPELINE
GROWTH
CAPITAL
BUILD
LEARN
EARN
TEAM
ACCOUNT
```

Only implemented routes may render as active navigation.
Future IA entries must not become dead links.

Desktop:

- persistent left command rail;
- hard border separating shell from workspace.

Tablet:

- collapsible rail / drawer.

Mobile:

- slide navigation or bottom-priority navigation;
- priority actions remain reachable without horizontal overflow.

## Responsive behavior

Breakpoints are behavior-based, not device-brand-based.

- `>1280px`: full cockpit.
- `1100–1280px`: reduced grid density.
- `<1100px`: left rail becomes off-canvas.
- `<760px`: action stacks and single-column operational modules.
- `<480px`: single-column metrics and compact spacing.

Horizontal scrolling is acceptable only inside intentionally scrollable
data tables; the overall dashboard must not overflow.

## Accessibility

- all interactive elements require visible `:focus-visible` treatment;
- body text and controls must meet WCAG AA contrast;
- color may not be the only status signal;
- navigation state uses both visual treatment and `aria-current`;
- mobile drawer closes on Escape;
- reduced-motion preference is respected.

## Public gateway

The Partner Command public index is a product gateway, not the canonical
funding-agency recruitment property.

It should communicate only:

### PARTNER COMMAND

Leads. Links. Training. Production. Next move.

Recruitment and long-form business-opportunity education belong on
`agency.distilledfunding.com`.

## Donor rules

- `moonshine-capital-portal`: visual DNA and tokens.
- `fpos`: composition reference only.
- `funding-partners-os-dashboard`: interaction/feature donor only.
- `funding-partners-os`: marketplace/resources donor only.
- `partner-command-center`: canonical IA and runtime owner.

Do not average donor styles.
Imported UX/content must be normalized into this
system.
