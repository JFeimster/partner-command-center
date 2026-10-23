import type { Metadata } from "next";
import { ResourceLibrary } from "@/components/resource-library";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requirePartnerSession } from "@/lib/auth";
import { normalizePartnerResourceFavorites } from "@/lib/partner-resource-favorites";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { partnerResources } from "@/lib/resource-catalog";
import { getPartnerResourcePartnerType } from "@/lib/dashboard-data";
import { partnerTypeToResourceAudience } from "@/lib/resource-audience";

export const metadata: Metadata = { title: "Partner resources", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PartnerResourcesPage() {
  const session = await requirePartnerSession();
  const supabase = await createServerSupabaseClient();
  const [{ data: auth }, partnerType] = await Promise.all([supabase.auth.getUser(), getPartnerResourcePartnerType()]);
  const saved = normalizePartnerResourceFavorites(auth?.user?.user_metadata?.partner_resource_favorites, new Set(partnerResources.map((resource) => resource.id)));
  const recommendedAudience = partnerTypeToResourceAudience(partnerType);
  return <WorkspaceShell mode="partner" organization={session.organizationName}>
    <div className="workspace-title-row"><div><span className="workspace-kicker">PARTNER ENABLEMENT</span><h1>Resources</h1><p>Find working referral tools and save the guides you use often.</p></div></div>
    {recommendedAudience && <p className="workspace-note">Showing resources recommended for your verified partner type: {recommendedAudience}. Choose another partner type to browse the full library.</p>}
    <section className="resource-center" aria-label="Partner resource library"><ResourceLibrary allowSave initialSavedResourceIds={saved} initialAudience={recommendedAudience ?? undefined} /></section>
  </WorkspaceShell>;
}
