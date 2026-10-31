import assert from "node:assert/strict";
import test from "node:test";
import { parseCampaignHandoff } from "../lib/growth-campaign.ts";

const sample = {
  schema: "moonshine.agency.campaign", version: 1,
  campaign: {
    config: { audience: "Construction and trades", objective: "Acquire business-owner conversations", channels: ["Email", "LinkedIn"], structure: "Three-touch sequence", context: "Funding education", agentName: "", businessName: "", professionId: "accountant", resourceIds: ["funding-guide"], layout: "Professional", hours: 5, sessions: 3, conversations: 5, followUps: 5, relationships: 2, durationWeeks: 4, mode: "Part-time agent" },
    name: "Trades campaign", objective: "Acquire business-owner conversations", audience: "Construction and trades", channels: ["Email", "LinkedIn"],
    sequence: [{ step: 1, channel: "Email", interval: "Day 1", body: "A sample." }],
    resources: [{ id: "funding-guide", title: "Public funding information", url: "https://www.distilledfunding.com/lending" }],
    assets: { outreach: "Outreach", referralKit: "Referral kit", marketing: "Marketing", activityPlan: "Activity plan" }
  }, attribution: { status: "unassigned" }
};

test("accepts a valid version 1 campaign and rejects untrusted identity fields", () => {
  assert.deepEqual(parseCampaignHandoff(JSON.stringify(sample)), sample);
  assert.equal(parseCampaignHandoff(JSON.stringify({ ...sample, partner_id: "untrusted" })), null);
  assert.equal(parseCampaignHandoff(JSON.stringify({ ...sample, version: 2 })), null);
});

test("rejects unsafe resources, malformed JSON, and oversized files", () => {
  const unsafe = structuredClone(sample);
  unsafe.campaign.resources[0].url = "javascript:alert(1)";
  assert.equal(parseCampaignHandoff(JSON.stringify(unsafe)), null);
  assert.equal(parseCampaignHandoff("{"), null);
  assert.equal(parseCampaignHandoff(" ".repeat(256_001)), null);
});
