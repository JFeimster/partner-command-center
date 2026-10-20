import type { Metadata } from "next";
import { requireOperatorSession } from "@/lib/auth";
import { getOperatorDashboard } from "@/lib/dashboard-data";
import { DashboardOverview } from "@/components/dashboard-overview";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Operator dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OperatorDashboardPage() {
  await requireOperatorSession();
  const data = await getOperatorDashboard();
  return <WorkspaceShell mode="operator" name={data.displayName} organization={data.organizationName}><DashboardOverview data={data} mode="operator" /></WorkspaceShell>;
}
