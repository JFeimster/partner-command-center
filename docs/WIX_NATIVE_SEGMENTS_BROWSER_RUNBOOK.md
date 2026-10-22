# Wix Native Saved Segment — Browser Execution Runbook

**Purpose:** Complete the owner-requested native Wix segment creation using an authenticated browser. This document is an execution runbook **not a claim that segments were created** by GitHub or the Wix REST API.

**Target Wix site:** Moonshine Capital, site `cc61a0cb-edcd-43dc-bdda-42c76443dcd6`.  
**Dashboard URL:** https://manage.wix.com/dashboard/cc61a0cb-edcd-43dc-bdda-42c76443dcd6/segments  
**Machine-readable current labels, filters and verified counts:** [WIX_LABEL_SEGMENT_PREVIEW_20261022.json](./WIX_LABEL_SEGMENT_PREVIEW_20261022.json)  
**Operational state filter contracts:** [WIX_SAVED_SEGMENTS_V1.md](./WIX_SAVED_SEGMENTS_V1.md)

## Exact instructions for ChatGPT Work / browser agent

Use an authenticated Wix dashboard browser session. Inventory existing **saved segments** first. Never duplicate a segment; if one exists, inspect its logic and **update only when the existing meaning clearly matches**. Do not delete any current segment as part of this operation.

Create native Wix saved **dynamic** segments from the attached manifest using the manifest's `name` and `labelKeys`. Interpret `filter:"ANY_LABEL"` as **OR** (matches *any* of the listed labels); never inadvertently change to AND. Use Wix UI's native label selectors, searching the current `displayNames`. The manifest was generated from an actual site read on 2026-10-22. Re-check the labels are still available. Never apply new labels to contacts, bulk-import contacts, or re-subscribe anybody while doing this.

### Start with highest-value, nonempty audiences

| Priority | Manifest ID | Exact segment | Contacts on 2026-10-22 |
| --- | --- | --- | ---: |
| 1 | L16 | ENG · Wix Chat Inquiries | 58 |
| 2 | L01 | FND · Historical Funding Prospect Sources | 57 |
| 3 | L08 | AFF · Affiliate Network Audience | 20 |
| 4 | L15 | AUD · Funding Education Audience | 11 |
| 5 | L07 | AFF · Historical Partner Prospects | 9 |
| 6 | L12 | AUD · AI and Funding Automation Interest | 8 |
| 7 | L02 | FND · Needs Qualification Label Queue | 4 |
| 8 | L10 | AFF · Broker Training Audience | 3 |
| 9 | L04 | FND · Ecommerce Funding Interest | 3 |
| 10 | L03 | FND · Gig Worker Funding Interest | 2 |
| 11 | L05 | FND · Real Estate Capital Interest | 2 |
| 12 | L09 | AFF · Partner Orientation Interest | 2 |
| 13 | L14 | COM · Confirmed Wix Group Members | 2 |
| 14 | L11 | AUD · Business Credit Interest | 1 |
| 15 | L13 | AUD · Business Acquisition Interest | 1 |

`L06` Equipment and Invoice Interest and `L17` Newsletter Acquisition Sources both matched 0 in the snapshot. Defer saving empty segments unless a live check reveals matching contacts and a clear operator use case.

### Operational status segments

Read `O01–O18` in `WIX_SAVED_SEGMENTS_V1.md`. Those filters use **actual custom contact fields**, not historical labels. Before creating each, validate in Wix that the correct custom field is available with an exact equality selector for the controlled string. Canonical fields: Partner Application Status, Partner Status, Partner Type, Funding Stage and Lead Status.

Because earlier 4,013-contact checks found no populated real operational mirror values, **do not fabricate contact data or empty segments merely to reach an arbitrary count**. After successful authenticated sync of a real partner/application/lead event, create the genuinely useful populated operational view(s), beginning with Applications — Review and Funding Documents Pending.

### Save/verify contract per segment

1. Saved dynamic segment exists in the Wix dashboard under its exact name (not a contact label, contact-list search, spreadsheet, or a GitHub JSON).
2. Every included Wix label/field and the OR/AND relationship matches its defined filter. Do not exceed the Wix builder's filter limits.
3. Wix displays an actual recipient count; record it along with a segment URL and 2–3 anonymized representative matches when appropriate. Counts may legitimately differ from the snapshot.
4. Verify the saved view persists after leaving/reopening the segment page.
5. **No messages are sent**, marketing enrollment is not toggled, and no audience is declared opted-in based solely on a source label.
6. Report new/existing/skipped/error counts and record each saved segment's Wix URL. Do not falsely claim any incomplete save.

### Authorized scope

Create/edit **saved dynamic segments only**. Do not delete contacts, change consent, create partner approvals, change applicant statuses, send email/SMS, or open partner portals. Stop and report if Wix's UI lacks an essential filter or a CAPTCHA/owner-login requires human intervention.

## Why browser execution is needed

The installed Wix REST connector does not expose a supported native Segments create/update endpoint. The site's installed app tool-provider discovery also returned zero providers. An ordinary ChatGPT Browser read session reported that it required an originating browser extension context. **Use ChatGPT Work with Cloud Browser** (or an authenticated human browser session) to run these native UI operations, rather than inventing REST endpoints or substituting labels as segments.
