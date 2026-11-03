import { timingSafeEqual } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DESTINATION_HOST = "capital.distilledfunding.com";
const text = (value, max) => typeof value === "string" && value.trim().length > 0 && value.length <= max;

export function parsePartnerMicrositeTenantMap(raw) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 32768) return { valid: false, mappings: [], reason: "missing_or_oversize_map" };
  let entries;
  try { entries = JSON.parse(raw); } catch { return { valid: false, mappings: [], reason: "invalid_map_json" }; }
  if (!Array.isArray(entries) || entries.length > 200) return { valid: false, mappings: [], reason: "invalid_map_shape" };
  const mappings = [];
  const slugs = new Set();
  for (const item of entries) {
    if (!item || typeof item !== "object" || !SLUG.test(item.slug || "") || item.slug.length > 48 || !UUID.test(item.partnerId || "") || !UUID.test(item.organizationId || "") || item.status !== "approved" || typeof item.approvedAt !== "string" || Number.isNaN(Date.parse(item.approvedAt)) || !text(item.evidenceRef, 120)) return { valid: false, mappings: [], reason: "invalid_or_unapproved_mapping" };
    if (slugs.has(item.slug)) return { valid: false, mappings: [], reason: "duplicate_tenant_slug" };
    slugs.add(item.slug);
    mappings.push({ slug: item.slug, partnerId: item.partnerId, organizationId: item.organizationId, status: "approved" });
  }
  return { valid: true, mappings, reason: null };
}

export function authorizePartnerMicrositeRequest(authorization, configuredToken) {
  if (typeof configuredToken !== "string" || configuredToken.length < 32) return { authorized: false, status: 503, reason: "integration_not_configured" };
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return { authorized: false, status: 401, reason: "unauthorized" };
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(configuredToken);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return { authorized: false, status: 401, reason: "unauthorized" };
  return { authorized: true, status: 200, reason: null };
}

function validPartnerDestination(value, partnerCode) {
  if (!text(value, 2048)) return false;
  try {
    const url = new URL(value);
    const refs = url.searchParams.getAll("ref");
    return url.protocol === "https:" && url.hostname === DESTINATION_HOST && !url.port && !url.username && !url.password && refs.length === 1 && refs[0] === partnerCode;
  } catch { return false; }
}

/** Build an allowlisted public projection from organization-scoped PCC rows. */
export function buildPartnerMicrositeProjection({ mapping, partner, activeAccounts, trackingLinks }) {
  if (!mapping || mapping.status !== "approved" || !UUID.test(mapping.partnerId || "") || !UUID.test(mapping.organizationId || "")) return { ok: false, reason: "tenant_not_approved" };
  if (!partner || partner.id !== mapping.partnerId || partner.organization_id !== mapping.organizationId || partner.status !== "active" || partner.metadata?.fictional === true || !text(partner.name, 80) || !text(partner.partner_code, 80)) return { ok: false, reason: "partner_inactive_or_scope_mismatch" };
  if (!Array.isArray(activeAccounts) || !activeAccounts.some((account) => account?.partner_id === mapping.partnerId && account?.organization_id === mapping.organizationId && account?.status === "active")) return { ok: false, reason: "active_partner_portal_membership_required" };
  const rows = Array.isArray(trackingLinks) ? trackingLinks : [];
  const selected = rows.find((link) => link?.is_active === true && link.partner_id === mapping.partnerId && link.organization_id === mapping.organizationId && UUID.test(link.id || "") && text(link.slug, 80) && validPartnerDestination(link.destination_url, partner.partner_code));
  return {
    ok: true,
    projection: {
      schemaVersion: "pcc-partner-microsite-v1",
      tenantSlug: mapping.slug,
      mappingStatus: "approved",
      partner: {
        id: partner.id,
        organizationId: partner.organization_id,
        displayName: partner.name.trim(),
        partnerCode: partner.partner_code.trim(),
        partnerType: text(partner.partner_type, 80) ? partner.partner_type.trim() : "partner",
        status: "active"
      },
      trackingLink: selected ? {
        id: selected.id,
        organizationId: selected.organization_id,
        partnerId: selected.partner_id,
        slug: selected.slug,
        destinationUrl: selected.destination_url,
        isActive: true
      } : null
    }
  };
}
