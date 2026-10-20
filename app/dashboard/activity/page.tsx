import type { Metadata } from "next";
import { ActivityFeed } from "@/components/activity-feed";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getPartnerActivity } from "@/lib/dashboard-data";
import { requirePartnerSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Partner activity", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PartnerActivityPage() {
  await requirePartnerSession();
  const { items } = await getPartnerActivity();
  return <WorkspaceShell mode="partner"><div className="workspace-title-row"><div><span className="workspace-kicker">ACCOUNT HISTORY</span><h1>Activity</h1><p>Recent partner actions recorded in the workspace.</p></div></div><ActivityFeed items={items} /></WorkspaceShell>;
}
