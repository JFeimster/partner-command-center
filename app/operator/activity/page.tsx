import type { Metadata } from "next";
import { ActivityFeed } from "@/components/activity-feed";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getOperatorActivity } from "@/lib/dashboard-data";
import { requireOperatorSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Operator activity", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OperatorActivityPage() {
  await requireOperatorSession();
  const { items } = await getOperatorActivity();
  return <WorkspaceShell mode="operator"><div className="workspace-title-row"><div><span className="workspace-kicker">AUDIT TRAIL</span><h1>Activity history</h1><p>Partner workflow actions recorded for this organization.</p></div></div><ActivityFeed items={items} /></WorkspaceShell>;
}
