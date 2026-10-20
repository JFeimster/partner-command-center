import type { Metadata } from "next";
import { requireOperatorSession } from "@/lib/auth";
import { getOperatorPartners } from "@/lib/dashboard-data";
import { FilterTable } from "@/components/filter-table";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Partner directory", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  await requireOperatorSession();
  const { items } = await getOperatorPartners();
  const rows = items.map((item) => ({ id: item.id, name: item.name, organizationName: item.organizationName, email: item.email, status: item.status, joinedAt: item.joinedAt?.slice(0, 10) }));
  return <WorkspaceShell mode="operator"><div className="workspace-title-row"><div><span className="workspace-kicker">PARTNER NETWORK</span><h1>Partner directory</h1><p>Partner records visible to your operator account.</p></div></div><FilterTable columns={[{ key: "name", label: "Partner" }, { key: "organizationName", label: "Organization" }, { key: "email", label: "Email" }, { key: "status", label: "Status", kind: "status" }, { key: "joinedAt", label: "Joined" }]} rows={rows} searchLabel="Search partners" emptyTitle="No partner records" emptyBody="Partner records will appear here as they are created in the connected organization." /></WorkspaceShell>;
}
