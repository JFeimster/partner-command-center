import test from "node:test";
import assert from "node:assert/strict";
import { authorizePartnerMicrositeRequest, buildPartnerMicrositeProjection, parsePartnerMicrositeTenantMap } from "../lib/partner-microsite-projection.mjs";

const partnerId = "9a5eb9a4-194a-445d-88c4-5682211a4311";
const organizationId = "5d366093-6264-44e2-9501-405dcb5f7c16";
const linkId = "85a7e168-7fb7-4d26-a4be-44fd376f9b45";
const token = "fixture-only-read-token-1234567890";
const mapping = { slug: "harbor-live", partnerId, organizationId, status: "approved" };
const partner = { id: partnerId, organization_id: organizationId, name: "Harbor Business Group", partner_code: "HARBOR42", partner_type: "referral_partner", status: "active", contact_email: "private@example.test", metadata: { fictional: false, private: "excluded" } };
const account = { partner_id: partnerId, organization_id: organizationId, status: "active", user_id: "private" };
const link = { id: linkId, organization_id: organizationId, partner_id: partnerId, slug: "harbor-2026", destination_url: "https://capital.distilledfunding.com/partner-start?ref=HARBOR42", is_active: true, created_at: "2026-11-03T00:00:00Z", campaign: "private" };
const mapEntry = { slug: mapping.slug, partnerId, organizationId, status: "approved", approvedAt: "2026-11-03T00:00:00Z", evidenceRef: "local-approval-fixture" };

test("tenant map requires explicit approval evidence, valid identifiers, and unique slugs", () => {
  assert.equal(parsePartnerMicrositeTenantMap(undefined).valid, false);
  assert.equal(parsePartnerMicrositeTenantMap("invalid").valid, false);
  assert.equal(parsePartnerMicrositeTenantMap(JSON.stringify([{ ...mapEntry, status: "pending" }])).valid, false);
  assert.equal(parsePartnerMicrositeTenantMap(JSON.stringify([mapEntry, mapEntry])).reason, "duplicate_tenant_slug");
  assert.equal(parsePartnerMicrositeTenantMap(JSON.stringify([{ ...mapEntry, partnerId: "not-a-uuid" }])).valid, false);
  assert.equal(parsePartnerMicrositeTenantMap(JSON.stringify([mapEntry])).valid, true);
});

test("bearer auth is required and uses constant-time equality for matching lengths", () => {
  assert.equal(authorizePartnerMicrositeRequest(null, token).status, 401);
  assert.equal(authorizePartnerMicrositeRequest(`Bearer ${token.slice(0, -1)}x`, token).authorized, false);
  assert.equal(authorizePartnerMicrositeRequest(`Bearer ${token}`, token).authorized, true);
  assert.equal(authorizePartnerMicrositeRequest(`Bearer ${token}`, "short").status, 503);
});

test("projection requires active in-scope partner and portal membership, strips private fields, and preserves the verified URL", () => {
  const result = buildPartnerMicrositeProjection({ mapping, partner, activeAccounts: [account], trackingLinks: [link] });
  assert.equal(result.ok, true);
  assert.equal(result.projection.trackingLink.destinationUrl, link.destination_url);
  assert.equal("contact_email" in result.projection.partner, false);
  assert.equal("metadata" in result.projection.partner, false);
  assert.equal("campaign" in result.projection.trackingLink, false);
  assert.equal("user_id" in result.projection, false);
  assert.equal("referrals" in result.projection, false);
});

test("rejects fictional/inactive/cross-org identities and scopes links strictly", () => {
  assert.equal(buildPartnerMicrositeProjection({ mapping: { ...mapping, status: "pending" }, partner, activeAccounts: [account], trackingLinks: [link] }).ok, false);
  assert.equal(buildPartnerMicrositeProjection({ mapping, partner: { ...partner, metadata: { fictional: true } }, activeAccounts: [account], trackingLinks: [link] }).ok, false);
  assert.equal(buildPartnerMicrositeProjection({ mapping, partner: { ...partner, organization_id: "f86dc11a-abd7-4c8d-a606-526bbc6d4342" }, activeAccounts: [account], trackingLinks: [link] }).ok, false);
  assert.equal(buildPartnerMicrositeProjection({ mapping, partner, activeAccounts: [{ ...account, status: "inactive" }], trackingLinks: [link] }).reason, "active_partner_portal_membership_required");
  assert.equal(buildPartnerMicrositeProjection({ mapping, partner, activeAccounts: [account], trackingLinks: [{ ...link, partner_id: organizationId }] }).projection.trackingLink, null);
  assert.equal(buildPartnerMicrositeProjection({ mapping, partner, activeAccounts: [account], trackingLinks: [{ ...link, destination_url: "https://capital.distilledfunding.com/?ref=HARBOR42&ref=HARBOR42" }] }).projection.trackingLink, null);
});
