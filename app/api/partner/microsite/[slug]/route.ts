import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { authorizePartnerMicrositeRequest, buildPartnerMicrositeProjection, parsePartnerMicrositeTenantMap } from "@/lib/partner-microsite-projection.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const responseHeaders = { "Cache-Control": "private, no-store", "Content-Type": "application/json; charset=utf-8", Vary: "Authorization", "X-Content-Type-Options": "nosniff" };
const json = (body: unknown, status: number) => Response.json(body, { status, headers: responseHeaders });

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authorization = authorizePartnerMicrositeRequest(request.headers.get("authorization"), process.env.PCC_MICROSITE_READ_TOKEN);
  if (!authorization.authorized) return json({ error: authorization.reason }, authorization.status);

  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 48) return json({ error: "not_found" }, 404);
  const map = parsePartnerMicrositeTenantMap(process.env.PCC_MICROSITE_TENANT_MAP_JSON);
  if (!map.valid) return json({ error: "projection_not_configured" }, 503);
  const mapping = map.mappings.find((item) => item.slug === slug && item.status === "approved");
  if (!mapping) return json({ error: "not_found" }, 404);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "projection_not_configured" }, 503);

  try {
    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const [partnerResult, accountResult, linkResult] = await Promise.all([
      supabase.from("partners").select("id,organization_id,name,partner_code,partner_type,status,metadata")
        .eq("id", mapping.partnerId).eq("organization_id", mapping.organizationId).maybeSingle(),
      supabase.from("partner_portal_accounts").select("partner_id,organization_id,status")
        .eq("partner_id", mapping.partnerId).eq("organization_id", mapping.organizationId).eq("status", "active").limit(2),
      supabase.from("tracking_links").select("id,organization_id,partner_id,slug,destination_url,is_active,created_at")
        .eq("partner_id", mapping.partnerId).eq("organization_id", mapping.organizationId).eq("is_active", true)
        .order("created_at", { ascending: false }).limit(40)
    ]);
    if (partnerResult.error || accountResult.error || linkResult.error) return json({ error: "projection_unavailable" }, 503);
    const result = buildPartnerMicrositeProjection({ mapping, partner: partnerResult.data, activeAccounts: accountResult.data ?? [], trackingLinks: linkResult.data ?? [] });
    if (!result.ok) return json({ error: result.reason === "active_partner_portal_membership_required" ? "not_found" : "partner_unavailable" }, 404);
    return json(result.projection, 200);
  } catch {
    return json({ error: "projection_unavailable" }, 503);
  }
}
