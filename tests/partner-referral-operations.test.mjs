import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { nextReferralStatuses, toReferralCsv } = require("../lib/referral-operations.ts");

test("referral status controls only expose forward operator actions", () => {
  assert.deepEqual(nextReferralStatuses("submitted"), ["accepted", "rejected"]);
  assert.deepEqual(nextReferralStatuses("accepted"), ["qualified", "rejected"]);
  assert.deepEqual(nextReferralStatuses("qualified"), ["converted", "rejected"]);
  assert.deepEqual(nextReferralStatuses("converted"), []);
  assert.deepEqual(nextReferralStatuses("rejected"), []);
  assert.deepEqual(nextReferralStatuses("unknown"), []);
});

test("referral export quotes values and neutralizes spreadsheet formulas", () => {
  const csv = toReferralCsv([{
    submitted_at: "2026-10-22T12:00:00Z",
    business: '=HYPERLINK("https://invalid.example")',
    contact: "Jane \"J\" Smith",
    partner: "Referral Partner",
    status: "submitted",
    source: "partner_portal",
    campaign: "+SUM(A1:A2)"
  }]);
  assert.ok(csv.includes(`"'=HYPERLINK(""https://invalid.example"")"`));
  assert.ok(csv.includes(`"Jane ""J"" Smith"`));
  assert.ok(csv.includes(`"'+SUM(A1:A2)"`));
  assert.ok(csv.includes("\r\n"));
});
