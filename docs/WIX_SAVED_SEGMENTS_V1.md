# Wix dynamic segment contracts — Moonshine Capital

These are **saved dynamic segments**, not static Wix labels. Wix supports custom contact fields as filters and up to 10 filter rules per segment. A supported public native segment creation endpoint was not found.

## Source field keys

- Partner Status: custom.partner-status-aqgsprsuyxigeupsffng
- Partner Type: custom.partner-type-ofupshmfvqlhfypumeytfe
- Partner Application Status: custom.partner-application-status-xjcrhapo
- Lead Status: custom.lead-status-eyvsodtqmzhliowvkrkwhlu
- Funding Stage: custom.funding-stage-kevpmtfjtluxpcpnhgtzb
- Contact Type: custom.contact-type-fthrfdxphfogegdztkapds
- Lead Source: custom.lead-source-zcrhbqpohwzdpupzmoogcip

| Saved segment | Custom-field logic | Use |
| --- | --- | --- |
| OPS · Partner Applications — Review | Partner Application Status = new OR needs_review | Application review |
| OPS · Partner Applications — Onboarding | Partner Application Status = onboarding | Intake checklist |
| OPS · Partner Applications — Approved | Partner Application Status = approved | Approved intake, not activation |
| OPS · Partners — Pending | Partner Status = pending | Operator queue |
| OPS · Partners — Active | Partner Status = active | Active partner operations |
| OPS · Partners — Paused | Partner Status = paused | Suppression and review |
| OPS · Funding Brokers | Partner Type = funding_broker | Role operations |
| OPS · Referral Partners | Partner Type = referral_partner | Role operations |
| OPS · Affiliates | Partner Type = affiliate_partner | Role operations |
| OPS · Funding Intake Captured | Funding Stage = intake_captured | Funding pipeline |
| OPS · Funding Review Requested | Funding Stage = review_requested | Broker review |
| OPS · Funding Documents Pending | Funding Stage = documents_pending | Document follow-up |
| OPS · Funding Nurture | Lead Status = nurture | Qualification follow-up |

## Operational safety

1. Never fabricate statuses to force segment membership. Only authoritative upstream events may set these mirror values.
2. These are **internal segments**, not email campaign audiences. Any email campaign additionally needs Wix subscription/consent eligibility and appropriate suppression rules.
3. Segment membership never implies approval, marketing consent, funding qualification, or partner portal access.
4. A SOURCE · Partner Application label from the live Wix form is evidence of form submission, **not** evidence of platform-core ingestion or approval.
5. Construct these native Wix segments in Manage Segments at https://manage.wix.com/dashboard/cc61a0cb-edcd-43dc-bdda-42c76443dcd6/segments or by controlling the browser in Work. Do not substitute static labels.
6. Verify the resulting contact counts and filters. The canonical database currently has 53 QA partner rows (all fictional) and no partner applications, leads or brokerflow deals. New synchronized statuses are therefore initially empty.

## Release gate

The hourly Vercel worker requires WIX_API_KEY, SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET as server-side protected values, plus SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL. Do not place secrets in source code, client-side fields, or documentation. The connected Wix chat tool's token is not automatically exposed to Vercel.
