"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { isPartnerResourceId, normalizePartnerResourceFavorites } = require("../lib/partner-resource-favorites");
const allowedIds = new Set(["tracking-links", "funding-readiness"]);

test("resource favorites accept only catalog resources and remove duplicates", () => {
  assert.equal(isPartnerResourceId("tracking-links", allowedIds), true);
  assert.equal(isPartnerResourceId("made-up-resource", allowedIds), false);
  assert.deepEqual(normalizePartnerResourceFavorites(["tracking-links", "tracking-links", "unknown", 4], allowedIds), ["tracking-links"]);
});

test("resource favorite metadata safely normalizes missing or malformed values", () => {
  assert.deepEqual(normalizePartnerResourceFavorites(null, allowedIds), []);
  assert.deepEqual(normalizePartnerResourceFavorites("tracking-links", allowedIds), []);
});
