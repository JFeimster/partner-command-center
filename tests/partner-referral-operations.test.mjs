import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { nextReferralStatuses, partnerReferralGuidance, referralReviewAgeDays, toReferralCsv } = require("../lib/referral-operations.ts");

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

test("partner referral guidance explains recorded workflow status without implying outcomes", () => {
  assert.equal(partnerReferralGuidance("submitted").label, "Submitted");
  assert.match(partnerReferralGuidance("submitted").nextAction, /No action is needed/);
  assert.equal(partnerReferralGuidance("rejected").label, "Closed");
  assert.match(partnerReferralGuidance("converted").nextAction, /does not confirm funding/);
  assert.equal(partnerReferralGuidance("unexpected").label, "Status updated");
});

test("referral review age uses elapsed days and fails safely for invalid or future timestamps", () => {
  const now = Date.parse("2026-10-23T12:00:00.000Z");
  assert.equal(referralReviewAgeDays("2026-10-23T00:00:00.000Z", now), 0);
  assert.equal(referralReviewAgeDays("2026-10-21T11:59:59.000Z", now), 2);
  assert.equal(referralReviewAgeDays("not-a-date", now), null);
  assert.equal(referralReviewAgeDays("2026-10-24T00:00:00.000Z", now), null);
});
