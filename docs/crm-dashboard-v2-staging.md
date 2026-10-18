# Master Applicants CRM — Dashboard V2 staging specification

**Status:** review only; no Google Sheets writes, deployment, CRM updates, or message sends.  
**Source of truth:** [Master Applicants CRM](https://docs.google.com/spreadsheets/d/1Bc8Im3uD1_5qAvS-VYBoXdWjFAX5wWecTKP3Hw44PJo/edit), `Master Applicants!A:AT` (46 positional fields).  
**Repository integration:** [`lib/google-sheets-sync.js`](../lib/google-sheets-sync.js).  
**Notion tasks:** CRM-06, CRM-07, CRM-08, CRM-09, CRM-10, CRM-14, CRM-16, CRM-17.  
**Baseline date:** 2026-10-18 (snapshot, *not* a claim of live ongoing counts).  
**Workbook locale:** `en_US`; **timezone:** `Etc/GMT` (operator business dates are Eastern Time).  
**Sheet IDs:** do not change the IDs or names of any existing tabs.

## 1. Existing-state findings and metric definitions

| Existing worksheet | Status | Problem or action |
|---|---|---|
| Dashboard | A1:H7 contains KPI formulas | B2:B7 read `Y`, `AG`, `AC`, `AE` **on Dashboard**, not `Master Applicants`; all display `0`. |
| Dashboard D:H | Hardcoded provider summary | `DAC Applet` misses `DAC` source records; BankBreezy/Giggle search Gmail label substrings rather than canonical routes/products. |
| DAC View | A1 `FILTER` from `Master Applicants!D` | Keep as compatibility view; 172 DAC source rows in snapshot. |
| BankBreezy View | Static copied data | 77 rows in view versus 101 records where `funding_product=BankBreezy`; reconstruct as a *separate* dynamic staging view only after matching semantics. |
| Giggle View | A1 `FILTER` from `Master Applicants!U` | Keep compatibility view; 94 Giggle-product rows. |
| Follow-Up Queue | A1 `FILTER` includes regex statuses and raw date compare | Mixed ISO text/native dates make raw `AJ<=TODAY()` unsafe; closed cases with due dates exist. |
| Exceptions | A1 filter includes `closed lost` | 146 displayed records mainly include closed cases; separate closed cases from true quality exceptions. |
| Status Map / Lists | Fixed provider/status options | `Lists.providers` includes DAC, DAC Applet, BankBreezy, Giggle; per-cell `funding_product` validation sampled only BankBreezy/Giggle. Do not broaden validations without integration review. |

### Baseline assertions (independently verify at rollout)

- 220 populated records, **140 Closed Lost** (`Y`), **47 nonblank nonterminal statuses**, **33 blank statuses**. The nonterminal group includes statuses such as `Unknown`: it is **not** the same thing as qualified active funding opportunities.
- `source_provider=DAC`: 172; `source_provider=BankBreezy`: 29. `funding_product=BankBreezy`: 101; `funding_product=Giggle`: 94. Never compare these as if they were the same dimension.
- 23 nonempty `next_follow_up_at`, 19 nonterminal/unclassified records dated before 2026-10-18, 4 terminal records with dates; 14 `bank_connection_status=Pending`; 11 `documents_status=Requested`; 3 `documents_status=Missing`.
- `Closed Won` or `Funded` statuses not recorded in this snapshot. This **does not prove no fundings occurred**; historical provider submissions, real payouts, and automations are untracked or incomplete.
- At least one duplicated `record_id` group; **never merge by email alone**. `lib/google-sheets-sync.js` reads/writes positional columns `A:AT` and has event-aware case matching.
- `source_provider` mixes actual route/source systems (`Wix`, `HubSpot`, `Email Intake`, `Tally Funding Intake`) and named providers. **Dashboard labels must say “Source / Route,” not lender performance**.
- Blank status is always `Needs status review`, even if `stage` is populated. Flag stage/status divergence; don't silently repair it in dashboard formulas.

### Semantic KPI contract

| KPI | Definition | Baseline | Data owner |
|---|---|---:|---|
| Case records | Nonblank `record_id` in source; separately report rows with missing ID | 220 | Master A |
| Nonterminal recorded status | `status` nonblank, not Closed Lost, Closed Won or Funded | 47 | Master Y |
| Needs status review | `status` blank, irrespective of `stage` | 33 | Master Y |
| Closed Lost | Exact normalized `status=Closed Lost` | 140 | Master Y |
| Funded/won status *recorded* | `status=Closed Won` or `Funded`; not independently verified funding | 0 | Master Y |
| Past-due follow-up | Valid `next_follow_up_at` calendar date **before ET business date**, not terminal | 19 | Master AJ + Y |
| Bank link pending (all recorded cases) | `bank_connection_status=Pending` | 14 | Master AC |
| Documents requested/missing (all recorded cases) | `documents_status=Requested` or `Missing` | 14 | Master AE |
| Provider submissions / funded dollars / offers / messaging health | Not tracked until reconciled provider/submission/outreach ledgers exist | **Not tracked** | future ledger |

## 2. Field-placement contract

- **Existing Master Applicants columns only**: `record_id`, status/stage, owner/follow-up, bank connection, document status, provider source, funding product, and timestamps already defined in A:AT. Never insert, rename, reorder, or repurpose those columns.
- **Dashboard Data (Staging)**: calculated, disposable projections and filtered data; no manually maintained applicant properties or message history.
- **Dashboard V2 (Staging)**: metrics, controls, charts and operator-only views. No new source-of-truth applicant fields.
- **Provider Submissions** (later separate tab): one row per provider submission, keyed by `submission_id` and existing applicant `record_id` plus authoritative case mapping; never one column per provider.
- **Outreach Events / Applicant Workflow State** (later separate tabs or durable backend): append-only message events vs one row per case for next action. Do not implement in this staging change.
- **Provider Directory (Cache)** optional only after source-of-truth and alias review; do not copy Notion data arbitrarily.

## 3. Proposed new sheets, layouts and formula anchors

Create **only after authorization**; do not replace/rename production `Dashboard`. Add two tabs to the **same** spreadsheet, with new unique sheet IDs generated by Sheets, not manually guessed.

### A. `Dashboard Data (Staging)` — at least 1001 rows × 44 columns (A:AR)

Row 1, **A:O** exact headers:

| Column | Header | Existing Master source / transformation |
|---|---|---|
| A | record_id | A |
| B | created_date | B; native date, ISO or US `en_US` date string → calendar date; invalid remains blank and is flagged separately |
| C | next_follow_up_date | AJ; same date normalization |
| D | lifecycle_bucket | Y: `Terminal`, `Nonterminal`, `Needs status review` |
| E | action_flag | review-only next action; must not send messages |
| F | source_provider | D; source/route, not receiving lender |
| G | funding_product | U; a product/lane may differ from source |
| H | source_channel | E |
| I | follow_up_owner | AH |
| J | stage | W; retained for discrepancy review |
| K | documents_status | AE |
| L | bank_connection_status | AC |
| M | follow_up_status | AG |
| N | quality_flag | derived missing/unknown status, duplicated IDs, stage mismatch |
| O | raw_status | Y |

Rows 1 **Q:AE** repeat the A:O headers, using `Q1:AE1` as a filtered-projection header. **P** is a deliberate spacer. All Q:AE rows are derived, never editable source values. `AG2:AJ` may hold small query summary tables for charts, with another spacer AF. Reserve `AL:AR` for filtered dropdown source lists; keep both blocks outside the projected `Q:AE` spill.

**Formula anchors:** paste only each anchor below, letting it spill through the referenced range. Freeze header rows and protect formula regions when creating the staging tabs.

`A2`:
```gs
=ARRAYFORMULA(IF('Master Applicants'!A2:A1001="","",'Master Applicants'!A2:A1001))
```

`B2` (created date):
```gs
=MAP('Master Applicants'!A2:A1001,'Master Applicants'!B2:B1001,LAMBDA(id,raw,IF(id="","",IF(raw="","",IFERROR(IF(ISNUMBER(raw),INT(raw),DATEVALUE(LEFT(TO_TEXT(raw),10))),"")))))
```

`C2` (next follow-up):
```gs
=MAP('Master Applicants'!A2:A1001,'Master Applicants'!AJ2:AJ1001,LAMBDA(id,raw,IF(id="","",IF(raw="","",IFERROR(IF(ISNUMBER(raw),INT(raw),DATEVALUE(LEFT(TO_TEXT(raw),10))),"")))))
```

**Date cautions:** Google Sheets uses serial dates, some existing AJ cells are strings. This formula handles numeric serials and ISO strings starting with `YYYY-MM-DD`; it does not handle all US-style dates or reject every impossible ISO date. The offline validator implements stricter parsing. In QA, manually compare selected native timestamps, ISO timestamps, invalid dates, and DST crossings. Dates represent the original source *calendar date*, not automatic conversions from UTC to ET.

`D2`:
```gs
=MAP(A2:A1001,'Master Applicants'!Y2:Y1001,LAMBDA(id,st,IF(id="","",IF(st="","Needs status review",IF(REGEXMATCH(LOWER(TRIM(st)),"^(closed lost|closed won|funded)$"),"Terminal","Nonterminal")))))
```

`E2` (review only, never an automatic send trigger):
```gs
=MAP(A2:A1001,D2:D1001,C2:C1001,'Master Applicants'!AG2:AG1001,'Master Applicants'!AC2:AC1001,'Master Applicants'!AE2:AE1001,LAMBDA(id,bucket,due,follow,bank,docs,IF(id="","",IF(bucket="Terminal","None",IF(OR(AND(ISNUMBER(due),due<='Dashboard V2 (Staging)'!$M$5),REGEXMATCH(LOWER(follow),"overdue|needs follow-up|queued"),LOWER(bank)="pending",REGEXMATCH(LOWER(docs),"^(missing|requested)$")),"Review","None")))))
```

`F2:M2`, one formula in each cell (do **not** fill across):
```gs
F2 =ARRAYFORMULA(IF($A2:$A1001="","",'Master Applicants'!D2:D1001))
G2 =ARRAYFORMULA(IF($A2:$A1001="","",'Master Applicants'!U2:U1001))
H2 =ARRAYFORMULA(IF($A2:$A1001="","",'Master Applicants'!E2:E1001))
I2 =ARRAYFORMULA(IF($A2:$A1001="","",'Master Applicants'!AH2:AH1001))
J2 =ARRAYFORMULA(IF($A2:$A1001="","",'Master Applicants'!W2:W1001))
K2 =ARRAYFORMULA(IF($A2:$A1001="","",'Master Applicants'!AE2:AE1001))
L2 =ARRAYFORMULA(IF($A2:$A1001="","",'Master Applicants'!AC2:AC1001))
M2 =ARRAYFORMULA(IF($A2:$A1001="","",'Master Applicants'!AG2:AG1001))
```

`N2` (quality flags; out-of-band offline validator reports invalid dates separately):
```gs
=MAP(A2:A1001,D2:D1001,O2:O1001,J2:J1001,LAMBDA(id,bucket,st,stage,IF(id="","",TEXTJOIN("; ",TRUE,IF(bucket="Needs status review","Missing status",""),IF(LOWER(TRIM(st))="unknown","Unknown status",""),IF(COUNTIF($A$2:$A$1001,id)>1,"Duplicate record_id",""),IF(AND(LOWER(TRIM(st))="closed lost",LOWER(TRIM(stage))<>"closed lost"),"Stage/status mismatch","")))))
```

`O2`:
```gs
=ARRAYFORMULA(IF($A2:$A1001="","",'Master Applicants'!Y2:Y1001))
```

`Q2` (**filtered projection**; controls are on Dashboard V2):
```gs
=IFNA(FILTER(A2:O1001,A2:A1001<>"",IF('Dashboard V2 (Staging)'!$B$3="All",ROW(A2:A1001)>0,F2:F1001='Dashboard V2 (Staging)'!$B$3),IF('Dashboard V2 (Staging)'!$D$3="All",ROW(A2:A1001)>0,G2:G1001='Dashboard V2 (Staging)'!$D$3),IF('Dashboard V2 (Staging)'!$F$3="All",ROW(A2:A1001)>0,H2:H1001='Dashboard V2 (Staging)'!$F$3),IF('Dashboard V2 (Staging)'!$H$3="All",ROW(A2:A1001)>0,D2:D1001='Dashboard V2 (Staging)'!$H$3),IF('Dashboard V2 (Staging)'!$J$3="All",ROW(A2:A1001)>0,I2:I1001='Dashboard V2 (Staging)'!$J$3),IF('Dashboard V2 (Staging)'!$L$3="",ROW(A2:A1001)>0,B2:B1001>='Dashboard V2 (Staging)'!$L$3),IF('Dashboard V2 (Staging)'!$N$3="",ROW(A2:A1001)>0,B2:B1001<='Dashboard V2 (Staging)'!$N$3)),"")
```

`AG1`/`AH1`: `Lifecycle` / `Cases`; `AG2`:
```gs
=QUERY(Q1:AE1001,"select T,count(Q) where Q is not null group by T label T 'Lifecycle', count(Q) 'Cases'",1)
```
**Important:** The query `T` is the `lifecycle_bucket` of the filtered Q:AE projection, not the Master Applicants status. To avoid a duplicate header, leave AG1/AH1 empty when using the QUERY as shown (its own header labels are generated). Alternatively use a headerless QUERY with `label` and place static headers. Do not do both.

`AI2` (source-route group count, initial version):
```gs
=QUERY(Q1:AE1001,"select V,count(Q) where Q is not null group by V label V 'Source / Route',count(Q) 'Cases'",1)
```
Note that blank source routes can be dropped/grouped inconsistently by QUERY. QA must reconcile category totals to total filtered cases; replace with explicit `(blank)` handling if necessary. **These group counts are not true receiving-lender or submission counts.**

### B. `Dashboard V2 (Staging)` — at least 1100 rows × 15 columns (A:O)

| Cells | Use | Details |
|---|---|---|
| A1:O1 | Title | `Master Applicants CRM — Dashboard V2 / Staging` |
| A3, B3 | Source / Route filter | B3 default `All`; options from nonblank values of source F + `All` |
| C3, D3 | Funding Product filter | D3 default `All`; distinct source G values |
| E3, F3 | Source Channel filter | F3 default `All`; distinct H values |
| G3, H3 | Lifecycle filter | `All`, `Terminal`, `Nonterminal`, `Needs status review` |
| I3, J3 | Owner filter | J3 default `All`; enumerate actual owners plus `All` |
| K3, L3 | Created From | optional date; DATE validation |
| M3, N3 | Created Through | optional date; DATE validation |
| L5, M5 | Business date (ET) | **required manual value**, e.g. `2026-10-18`; date validation; do not trust workbook UTC `TODAY()` for ET timing |
| A7:O9 | KPI cards | formulas below; display Not tracked for missing datasets |
| A12:H26 | Lifecycle chart | clustered column/bar, source `Dashboard Data (Staging)!AG2:AH`, filtering aligned to controls |
| I12:O26 | Source/route chart | horizontal bar, source `AI2:AJ`, not funding-provider performance |
| A29:O30 | Queue heading + no-match message | operator-only read-only projection; no auto-sends |
| A32:O32 | Queue headers | same as data A:O; treat `record_id` as internal case reference |
| A33 | Table spill | formula below, with sufficient empty space to spill |

**KPI formulas** (computed from **filtered** `Dashboard Data (Staging)!Q:AE`; with controls `All`/blank the validated baseline appears):

```gs
B8 =COUNTIF('Dashboard Data (Staging)'!Q2:Q1001,"<>")
D8 =COUNTIF('Dashboard Data (Staging)'!T2:T1001,"Nonterminal")
F8 =COUNTIF('Dashboard Data (Staging)'!T2:T1001,"Needs status review")
H8 =COUNTIF('Dashboard Data (Staging)'!AE2:AE1001,"Closed Lost")
J8 =COUNTIFS('Dashboard Data (Staging)'!S2:S1001,">0",'Dashboard Data (Staging)'!S2:S1001,"<"&$M$5,'Dashboard Data (Staging)'!T2:T1001,"<>Terminal",'Dashboard Data (Staging)'!Q2:Q1001,"<>")
L8 =COUNTIF('Dashboard Data (Staging)'!AB2:AB1001,"Pending")
N8 =COUNTIF('Dashboard Data (Staging)'!AA2:AA1001,"Missing")+COUNTIF('Dashboard Data (Staging)'!AA2:AA1001,"Requested")
A30 =IF(B8=0,"No matching cases; check the filters.","")
A33 =IFNA(FILTER('Dashboard Data (Staging)'!Q2:AE1001,'Dashboard Data (Staging)'!Q2:Q1001<>""),"")
```

**Sizing guardrail:** the A33:O spill may return up to 1000 cases through row 1032. Allocate at least 1100 rows on Dashboard V2, keep all 15 output columns empty below A33, and place all validation helper lists on Dashboard Data AL:AR. The data sheet must have 44 columns (AR) to support those lists. Do not install any staging formulas without verifying their spill regions on a workbook copy.

**Operator view** A33:O shows only projected fields, not names, email, phones, business details or message bodies. Protect and restrict access to the workbook anyway: `record_id` is not public data, and current file permissions must be audited separately (CRM-01).

**Dropdown source and validation plan:** put controlled lists in a separate helper block on `Dashboard Data (Staging)!AL:AR` (not on the Dashboard V2 tab), or a *third cache only if necessary*. The Dashboard V2 action-table spill at `A33:O1032` means using dashboard rows 100:130 for lists would corrupt results. Use native strict `ONE_OF_RANGE` rules. Do not overload/modify the existing hidden `Lists` tab until review. Group controls are **source** or **product** filters, not actual provider-submission filters. Blank-value selection can be represented explicitly `(blank)` in a later iteration.

## 4. Operational views (separate tabs *only when operationally justified*)

| Named view | Proposed implementation | Eligibility / actions |
|---|---|---|
| Today's Action Queue | Filtered/styled staging table using E=`Review` | Nonterminal **or** unclassified. Due now, follow-up flagged, bank pending, or docs requested/missing. Assign owner, check stale status; **never trigger send**. |
| Stalled Applicants | Later derived view only after last *real progress* event exists | Current `updated_at` can reflect ingestion/replay; cannot reliably infer stalled from status alone. |
| Incomplete Applications | `stage/status` = `Incomplete` or `Submission Started` | Operator review; do not label a case abandoned solely on start event. |
| Bank Connection Pending | `bank_connection_status=Pending`, optionally status = Bank Connection Pending | Keep `Unknown`, blank separate; do not presume missing connection from a blank. |
| Missing Documents | `documents_status=Missing|Requested` | Treat Requested vs Missing distinctly. |
| Provider Performance | source-route distribution now, submission ledger later | Don't count products as separate lenders. |
| Exceptions | quality flags + invalid dates + missing IDs + sync failures when event source exists | Closed Lost alone is *not* an exception. |

Recommendation: initially show these as filtered cards/saved filters **within Dashboard V2**, not five new tabs with 46 copied columns. Add a dedicated action queue tab only when a daily workflow truly needs a separate surface.

## 5. Exact production Dashboard repairs (NOT authorized to apply)

These are initial **unfiltered legacy KPI replacements**. Recheck source figures immediately before cutover. Renaming the visible Dashboard KPI labels is permissible only with explicit approval; it is **not** a Master header change.

| Target | Label | Proposed formula | Snapshot expected |
|---|---|---|---:|
| `Dashboard!B2` | Nonterminal recorded status | `=COUNTIFS('Master Applicants'!A2:A,"<>",'Master Applicants'!Y2:Y,"<>",'Master Applicants'!Y2:Y,"<>Closed Lost",'Master Applicants'!Y2:Y,"<>Closed Won",'Master Applicants'!Y2:Y,"<>Funded")` | 47 |
| `Dashboard!B3` | Past-due follow-ups | `=COUNTIFS('Dashboard Data (Staging)'!A2:A1001,"<>",'Dashboard Data (Staging)'!C2:C1001,">0",'Dashboard Data (Staging)'!C2:C1001,"<"&'Dashboard V2 (Staging)'!$M$5,'Dashboard Data (Staging)'!D2:D1001,"<>Terminal")` | 19 |
| `Dashboard!B4` | Bank connection pending | `=COUNTIF('Master Applicants'!AC2:AC,"Pending")` | 14 |
| `Dashboard!B5` | Documents requested/missing | `=COUNTIF('Master Applicants'!AE2:AE,"Missing")+COUNTIF('Master Applicants'!AE2:AE,"Requested")` | 14 |
| `Dashboard!B6` | Recorded won/funded statuses | `=COUNTIF('Master Applicants'!Y2:Y,"Closed Won")+COUNTIF('Master Applicants'!Y2:Y,"Funded")` | 0 *recorded* |
| `Dashboard!B7` | Closed Lost | `=COUNTIF('Master Applicants'!Y2:Y,"Closed Lost")` | 140 |

**Dependency note:** B3 references new staging tabs. It cannot be rolled out in isolation. Before staging exists, only demonstrate B3 in a scratch cell or use the offline report, not in the production Dashboard. Dashboard D:H hardcoded provider summary should be replaced only **after** agreeing on source-route versus product reporting semantics.

## 6. Offline, read-only report utility and regression tests

- Module: `lib/crm-dashboard-v2.js`, zero external dependencies. Works on an operator-supplied **synthetic** `rows` JSON or a Google Sheets API `values` matrix including the exact 46 headers.
- CLI: `scripts/crm-dashboard-v2-report.js`. No Google API access, auth, Sheets writes, live requests, persistence or raw-row output. Caller provides input file path and an explicit `YYYY-MM-DD` ET business-date cutoff. Arbitrary source labels coalesce to `Other / unclassified`; no applicant row fields are printed.
- Fixture: `tests/fixtures/crm-dashboard-v2.synthetic.json`, no real applicant records, contact details, or email IDs.
- Tests: `tests/crm-dashboard-v2.test.js`, Node built-in `node:test` with date, blank-status, split source-vs-product, duplicate ID, stale follow-up, no-match and output privacy checks.

Run locally with no credentials:

```bash
node --test tests/crm-dashboard-v2.test.js
node scripts/crm-dashboard-v2-report.js \
  --input tests/fixtures/crm-dashboard-v2.synthetic.json \
  --business-date 2026-10-18
```

To compare with a real workbook, obtain a **private** bounded Google Sheets API `values` JSON response through an authorized read-only connector (range `'Master Applicants'!A1:AT1001`, `valueRenderOption=UNFORMATTED_VALUE`) and save it only to a secure local, excluded-from-Git path. Run the CLI on that file, compare summary counts to Dashboard V2 with the same ET cutoff, and **delete the private export according to your retention policy**. Never attach the export to a PR, logs, issue or test fixture. Do not use service-account environment variables to run this report.

For an automated nightly comparison in the future: first design a separate read-only data-fetch adapter and explicit source authorization, with no real PII in logs. **That adapter is out of scope**.

## 7. Staging rollout and rollback (approval-gated)

1. **Baseline:** capture tab IDs, existing B2:B7/D:H formulas and exact 46 headers, validations, permissions and baseline aggregates; save a secure workbook copy/version reference. Do not expose applicant rows or source credentials.
2. **Access:** resolve CRM-01 broad writer permission risk before widening dashboard access or creating additional PII-bearing views. Keep all staging views operator-only.
3. **Additive stage:** after authorization, append only the two proposed tabs, initialize exact sheet headers, date controls, formula anchors and formats; never edit existing tabs in this phase.
4. **QA:** reconcile independent counts for all 220 records; test both Excel/Sheets serial timestamps and ISO text; check blank/unclassified statuses, 19/4 due-date breakdown, all control combinations, zero-match behavior, duplicate IDs and blank provider fields; verify 15-column spills do not overwrite controls.
5. **Regression:** run `node --test tests/*.test.js tests/*.test.mjs` on the full repo; separately check `lib/google-sheets-sync.js` behavior and Cloudflare/Notion/HubSpot paths. The new tests alone do not prove the original suite passes.
6. **Conditional cutover:** only with separate approval, update production `Dashboard!B2:B7` and possibly provider summary, preserving formulas for rollback. Avoid changing sheet timezone/validation/source mappings in the same cutover.
7. **Post-change verification:** confirm metrics and Sheets sync via **read-only** checks first; coordinate any synthetic writes in a designated nonproduction workbook only with authorization.
8. **Rollback:** restore the exact saved Dashboard formulas and labels if needed. Remove *only* newly created staging tabs after checking for dependencies; do not alter original 11 tabs or any applicant records. Keep test/spec code for diagnosis.

## 8. Known limitations / review gates

- **No source modifications:** all Google Sheets edits and Notion status changes are outside this PR.
- Source appending beyond row 1001 requires an explicit capacity update; do not silently drop records. A durable implementation should use dynamic bounds with performance checks or automated limit alerts.
- `MAP/ARRAYFORMULA/FILTER/QUERY` formulas here are **design candidates**, not tested live in the target workbook. The offline validator is not a Google Sheets formula runtime. Check syntax, spill, type coercion, row counts and volatile date behavior in an authorized *copy* first.
- Source dates are treated as source calendar dates and `M5` is a manually maintained ET business date. This is not a DST-safe scheduled timestamp conversion. Time-of-day automation belongs to a durable backend workflow.
- Ambiguous cases, duplicate `record_id`s and missing statuses stay visible; no auto-merge or default stage filling.
- Workflow KPIs, funding-provider outcome metrics and commissions remain **Not tracked** without reconciled authoritative datasets.
- Existing static BankBreezy View is a compatibility artifact; new provider selectors should be based on a defined `source_provider` **or** `funding_product` dimension, never both interchangeably.