import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace-shell";
import { GrowthCampaignImporter } from "@/components/growth-campaign-importer";
import { getPartnerLinks, getPartnerProfile } from "@/lib/dashboard-data";
import { requirePartnerSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Campaign activation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CampaignImportPage() {
  await requirePartnerSession("/dashboard/growth/import");
  const [{ profile }, { items: links }] = await Promise.all([getPartnerProfile(), getPartnerLinks()]);
  return <WorkspaceShell mode="partner" name={profile?.name}><GrowthCampaignImporter profile={profile} links={links} /></WorkspaceShell>;
}
