import type { Metadata } from "next";
import { requireOperatorSession } from "@/lib/auth";
import { getOperatorPartners } from "@/lib/dashboard-data";
import { FilterTable } from "@/components/filter-table";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Partner directory", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PartnersPage({ searchParams }: { searchParams: Promise<{ status?: string | string[] }> }) {
  await requireOperatorSession();
  const params = await searchParams;
  const requestedStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = ["pending", "active", "paused", "terminated"].includes(requestedStatus || "") ? requestedStatus : undefined;
  const { items } = await getOperatorPartners(status);
  const rows = items.map((item) => ({ id: item.id, href: `/operator/partners/${item.id}`, name: item.name, organizationName: item.organizationName, email: item.email, status: item.status, partnerType: item.partnerType.replaceAll("_", " "), joinedAt: item.joinedAt?.slice(0, 10), lastActivityAt: item.lastActivityAt?.slice(0, 10) || "No activity" }));
  return <WorkspaceShell mode="operator"><div className="workspace-title-row"><div><span className="workspace-kicker">PARTNER NETWORK</span><h1>Partner directory</h1><p>Search the canonical partner records and see the latest update across each partner, account, referral, link, and follow-up task.</p></div></div><FilterTable columns={[{ key: "name", label: "Partner" }, { key: "organizationName", label: "Organization" }, { key: "email", label: "Email" }, { key: "status", label: "Status", kind: "status" }, { key: "partnerType", label: "Type" }, { key: "joinedAt", label: "Joined" }, { key: "lastActivityAt", label: "Last activity" }]} rows={rows} searchLabel="Search partners" emptyTitle="No partner records" emptyBody="Partner records will appear here as they are created in the connected organization." initialStatus={status || "all"} /></WorkspaceShell>;
}
