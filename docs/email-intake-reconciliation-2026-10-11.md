# Email intake reconciliation evidence report

**Evidence snapshot:** GitHub issue #74, production observations dated October 11, 2026. This report does not replay messages or modify CRM records.

**Production code:** Vercel reports the production alias running `main` at commit `c1aff86c417bcbc9d7a336ee9ce104cdf8a498e4` (#75). The read-only health check at 08:46Z reported the same destination configuration described in the issue.

## Email outcome classes

| Class | Evidence available | Finding |
| --- | --- | --- |
| Successfully processed | Vercel runtime log at 08:12:44Z reports one `/api/intake-message` applicant synced to HubSpot contact/deal, Notion, and Google Sheets row 93. | At least one intake event was fully processed. Its source message ID is not included in the issue evidence, so it cannot be matched to any Gmail notice. |
| Partially processed | The 06:15Z reconciliation scanned 27 records: 4 reconciled and 23 returned `reconciled_with_errors`; it updated 27 sheet rows. | 23 applicant reconciliation records need destination-level diagnosis. These are records/pages, not verified unique emails. The issue does not include per-record root causes or email IDs. |
| Bounced but processed | Gmail showed 14 delivery-delay notices and 7 final-failure notices for forwarding to intake. The issue also cites the successful 08:12:44Z event. | These are notification counts, not unique messages. No message-ID crosswalk is provided, so the number of bounce-noticed messages that were also processed is unknown. A bounce notice alone is not proof of loss. |
| Genuinely missing | A confirmed missing message requires matching a source email to no durable Cloudflare receipt, no Vercel event, and no destination record after identity checks. | No message-level Cloudflare, Gmail, Vercel, HubSpot, Notion, or Sheets export was included. **No emails can be confirmed missing from the supplied evidence. The actual missing count is unknown, not zero.** |

## Related production observations

- Cloudflare SMTP responses included `421 4.3.0 Upstream error`; the issue describes application-failure coupling as a hypothesis because Cloudflare exception logs were not attached.
- The endpoint health snapshot verified on October 11 at 08:28Z reported ready status and configured HubSpot, Notion, and Google Sheets connections, including direct Sheets API and legacy webhook configuration for `Master Applicants`. This proves configuration visibility, not successful writes for each email.
- A simultaneous backfill produced a HubSpot contact `409` and duplicate Notion/HubSpot artifacts. Cleanup archived two HubSpot deals, one contact, and two Notion pages; a later cleanup attempt found those pages already archived. No new cleanup or replay was run for this report.

## Data needed to close the reconciliation

Export the Gmail delivery notices with original message IDs and dates, Cloudflare Email Worker exceptions/acceptance events, Vercel `[email-intake-receipt]`, `[intake-message]`, and `[applicant-email-ingest]` event logs, plus matching HubSpot deal/contact IDs, Notion page IDs, and `Master Applicants` rows. Join on canonical `Message-ID` when present and the normalized MIME fingerprint otherwise. Classify each message only after all available sinks are checked. Keep ambiguous identities in review; do not replay them until a dry run proves the message is missing or incomplete and the applicant/case match is safe.
