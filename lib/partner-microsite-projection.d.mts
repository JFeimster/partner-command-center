export type PartnerMicrositeMapping = { slug: string; partnerId: string; organizationId: string; status: "approved" };
export function parsePartnerMicrositeTenantMap(raw: string | undefined): { valid: boolean; mappings: PartnerMicrositeMapping[]; reason: string | null };
export function authorizePartnerMicrositeRequest(authorization: string | null, configuredToken: string | undefined): { authorized: boolean; status: number; reason: string | null };
export function buildPartnerMicrositeProjection(input: { mapping: PartnerMicrositeMapping; partner: Record<string, unknown> | null; activeAccounts: Record<string, unknown>[]; trackingLinks: Record<string, unknown>[] }): { ok: boolean; reason?: string; projection?: Record<string, unknown> };
