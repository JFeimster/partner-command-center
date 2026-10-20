import type { Metadata } from "next";
import { requirePartnerSession } from "@/lib/auth";
import { getPartnerLinks } from "@/lib/dashboard-data";
import { FilterTable } from "@/components/filter-table";
import { WorkspaceShell } from "@/components/workspace-shell";
import { TrackingLinkForm } from "@/components/tracking-link-form";

export const metadata: Metadata = { title: "Tracking links", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TrackingLinksPage({ searchParams }: { searchParams: Promise<{ created?: string; error?: string }> }) {
  const params = await searchParams;
  await requirePartnerSession();
  const { items } = await getPartnerLinks();
  const rows = items.map((item) => ({ id: item.id, label: item.label, destinationUrl: item.destinationUrl, clicks: item.clicks, createdAt: item.createdAt?.slice(0, 10) }));
  return <WorkspaceShell mode="partner"><div className="workspace-title-row"><div><span className="workspace-kicker">ATTRIBUTION</span><h1>Tracking links</h1><p>Create a share URL with your partner referral code and campaign label.</p></div></div>{params.created && <p className="form-notice" role="status">Attributed link saved.</p>}{params.error && <p className="form-notice form-notice--error" role="alert">Link could not be saved. Use a valid page on capital.distilledfunding.com and confirm your partner access.</p>}<section className="portal-form-section"><div><span className="workspace-kicker">NEW LINK</span><h2>Build an attributed destination</h2><p>The partner code is added before the link is saved.</p></div><TrackingLinkForm /></section><FilterTable columns={[{ key: "label", label: "Link" }, { key: "destinationUrl", label: "Destination", kind: "url" }, { key: "createdAt", label: "Created" }]} rows={rows} searchLabel="Search tracking links" emptyTitle="No tracking links yet" emptyBody="Create a link above or ask an operator to assign one." /><p className="workspace-note">Activity counts appear only when recorded by the destination tracking system.</p></WorkspaceShell>;
}
