import type { Metadata } from "next";
import { requirePartnerSession } from "@/lib/auth";
import { getPartnerDashboard } from "@/lib/dashboard-data";
import { DashboardOverview } from "@/components/dashboard-overview";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Partner dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  await requirePartnerSession();
  const data = await getPartnerDashboard();
  return <WorkspaceShell mode="partner" name={data.displayName} organization={data.organizationName}><DashboardOverview data={data} mode="partner" /></WorkspaceShell>;
}
