"use client";

import { useState } from "react";
import type { CampaignHandoff } from "@/lib/growth-campaign";
import type { getPartnerLinks, getPartnerProfile } from "@/lib/dashboard-data";
import { parseCampaignHandoff } from "@/lib/growth-campaign";

type Props = {
  profile: Awaited<ReturnType<typeof getPartnerProfile>>["profile"];
  links: Awaited<ReturnType<typeof getPartnerLinks>>["items"];
};

function validAssignedDestination(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "capital.distilledfunding.com" && Boolean(url.searchParams.get("ref"));
  } catch { return false; }
}
const resourceHref = (value: string) => new URL(value, "https://moonshine-broker.vercel.app").toString();

function download(name: string, value: string) {
  const url = URL.createObjectURL(new Blob([value], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function GrowthCampaignImporter({ profile, links }: Props) {
  const [campaign, setCampaign] = useState<CampaignHandoff | null>(null);
  const [message, setMessage] = useState("");
  const [selectedLinkId, setSelectedLinkId] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [personalized, setPersonalized] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [destinationChecked, setDestinationChecked] = useState(false);
  const [exported, setExported] = useState(false);
  const availableLinks = links.filter((link) => validAssignedDestination(link.url));
  const selectedLink = availableLinks.find((link) => link.id === selectedLinkId);
  const ready = Boolean(campaign && selectedLink && reviewed && personalized && consentChecked && destinationChecked && exported);
  const status = !campaign ? "Import a campaign" : !selectedLink ? "Attribution unavailable" : ready ? "Ready for distribution" : "Ready for partner review";

  async function importFile(file?: File) {
    setMessage("");
    setCampaign(null);
    setSelectedLinkId("");
    setExported(false);
    if (!file) return;
    if (file.size > 256_000) { setMessage("Files must be 256 KB or smaller."); return; }
    const imported = parseCampaignHandoff(await file.text());
    if (!imported) { setMessage("This file is malformed, unsupported, or not a version 1 Moonshine campaign export."); return; }
    setCampaign(imported);
    setMessage("Campaign loaded in this browser. No account, campaign, or referral record was created.");
  }

  const finalPackage = (() => {
    if (!campaign) return "";
    const c = campaign.campaign;
    const destination = selectedLink ? `\n\n## Assigned partner destination\n\n${selectedLink.label}: ${selectedLink.url}\n\nThis is a destination stored on your authenticated partner record. Click measurement is not confirmed.` : "\n\n## Attribution\n\nNo eligible assigned partner destination selected. Campaign attribution is unavailable.";
    return [
      `# ${c.name}`, "", `Objective: ${c.objective}`, `Audience: ${c.audience}`, `Channels: ${c.channels.join(", ") || "None selected"}`, "",
      "## Campaign and outreach", c.assets.outreach, "", "## Referral partner materials", c.assets.referralKit, "", "## Marketing materials", c.assets.marketing,
      "", "## Educational resources", ...c.resources.map((resource) => `- [${resource.title}](${resourceHref(resource.url)})`), "", "## Activity plan", c.assets.activityPlan,
      destination, "", "Prepared in Partner Command for partner review. No messages were sent and no lead or outcome is claimed."
    ].join("\n");
  })();

  function exportPackage() {
    download("partner-campaign-activation.md", finalPackage);
    setExported(true);
  }

  return <div className="growth-importer">
    <div className="workspace-title-row"><div><span className="workspace-kicker">CAMPAIGN ACTIVATION</span><h1>Import a prepared campaign</h1><p>Review the campaign, choose a destination already assigned to your partner record, and export a shareable package.</p></div><span className="status-label">{status}</span></div>
    <section className="workspace-section">
      <div className="workspace-section__head"><h2>1. Load your campaign file</h2><span className="workspace-kicker">LOCAL FILE · UP TO 256 KB</span></div>
      <label className="campaign-file-label">Choose campaign JSON<input type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} /></label>
      {message && <p className="form-notice" role="status">{message}</p>}
    </section>
    {campaign && <>
      <section className="workspace-section">
        <div className="workspace-section__head"><h2>2. Review campaign details</h2><span className="workspace-kicker">EDITABLE IN THIS BROWSER</span></div>
        <div className="campaign-summary-grid">
          <label>Campaign name<input className="portal-field" value={campaign.campaign.name} onChange={(e) => setCampaign({ ...campaign, campaign: { ...campaign.campaign, name: e.target.value.slice(0, 300) } })} /></label>
          <label>Objective<input className="portal-field" value={campaign.campaign.objective} onChange={(e) => setCampaign({ ...campaign, campaign: { ...campaign.campaign, objective: e.target.value.slice(0, 300) } })} /></label>
          <label>Audience<input className="portal-field" value={campaign.campaign.audience} onChange={(e) => setCampaign({ ...campaign, campaign: { ...campaign.campaign, audience: e.target.value.slice(0, 300) } })} /></label>
          <div><span className="workspace-kicker">CHANNELS</span><p>{campaign.campaign.channels.join(", ") || "None selected"}</p></div>
        </div>
        <label className="campaign-assets-label">Outreach draft<textarea className="portal-field campaign-assets" value={campaign.campaign.assets.outreach} onChange={(e) => setCampaign({ ...campaign, campaign: { ...campaign.campaign, assets: { ...campaign.campaign.assets, outreach: e.target.value.slice(0, 40_000) } } })} /></label>
        <label className="campaign-assets-label">Marketing draft<textarea className="portal-field campaign-assets" value={campaign.campaign.assets.marketing} onChange={(e) => setCampaign({ ...campaign, campaign: { ...campaign.campaign, assets: { ...campaign.campaign.assets, marketing: e.target.value.slice(0, 40_000) } } })} /></label>
        <label className="campaign-assets-label">Referral kit<textarea className="portal-field campaign-assets" value={campaign.campaign.assets.referralKit} onChange={(e) => setCampaign({ ...campaign, campaign: { ...campaign.campaign, assets: { ...campaign.campaign.assets, referralKit: e.target.value.slice(0, 40_000) } } })} /></label>
        <label className="campaign-assets-label">Activity plan<textarea className="portal-field campaign-assets" value={campaign.campaign.assets.activityPlan} onChange={(e) => setCampaign({ ...campaign, campaign: { ...campaign.campaign, assets: { ...campaign.campaign.assets, activityPlan: e.target.value.slice(0, 40_000) } } })} /></label>
        <div><span className="workspace-kicker">EDUCATIONAL RESOURCES</span><ul>{campaign.campaign.resources.map((resource) => <li key={resource.id}><a href={resourceHref(resource.url)} target="_blank" rel="noopener noreferrer">{resource.title} ↗</a></li>)}</ul></div>
      </section>
      <section className="workspace-section">
        <div className="workspace-section__head"><h2>3. Partner identity and destination</h2><span className="workspace-kicker">AUTHENTICATED RECORD</span></div>
        {profile ? <><dl className="campaign-identity"><div><dt>Partner</dt><dd>{profile.name}</dd></div><div><dt>Partner code</dt><dd>{profile.partnerCode}</dd></div><div><dt>Account status</dt><dd>{profile.status}</dd></div><div><dt>Onboarding</dt><dd>{profile.application ? profile.application.status.replaceAll("_", " ") : "Review checklist"}</dd></div></dl><p><a href="/dashboard/onboarding">Open onboarding checklist ↗</a> · <a href="/dashboard/profile">Review profile ↗</a></p></> : <div className="empty-state"><strong>Partner record is not linked</strong><p>Campaign import is available, but there is no active partner record connected to this account. Use the verified email on your partner record to claim access.</p><a href="/auth/no-access">Review account access ↗</a></div>}
        <label className="campaign-link-select">Assigned destination<select className="portal-field" value={selectedLinkId} onChange={(e) => setSelectedLinkId(e.target.value)}><option value="">No destination selected</option>{availableLinks.map((link) => <option key={link.id} value={link.id}>{link.label} — {link.url}</option>)}</select></label>
        {selectedLink ? <div className="campaign-selected-link"><strong>{selectedLink.label}</strong><a href={selectedLink.url} target="_blank" rel="noopener noreferrer">{selectedLink.url}</a><p>Stored destination assigned to your authenticated partner record with a referral code. Downstream click tracking and referral receipt are not confirmed.</p><button type="button" className="workspace-action workspace-action--secondary" onClick={() => void navigator.clipboard.writeText(selectedLink.url)}>Copy destination</button></div> : <p className="form-notice form-notice--error">Attribution unavailable: no eligible assigned destination was found. Open <a href="/dashboard/links">Tracking links</a> for current options. New link creation remains limited to the approved capital destination.</p>}
      </section>
      <section className="workspace-section">
        <div className="workspace-section__head"><h2>4. Activation review</h2><span className="workspace-kicker">NO MESSAGES OR CRM RECORDS ARE CREATED</span></div>
        <div className="campaign-checklist"><label><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /> Campaign and contact details reviewed</label><label><input type="checkbox" checked={personalized} onChange={(e) => setPersonalized(e.target.checked)} /> Messages personalized for the intended audience</label><label><input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} /> Consent and channel requirements considered</label><label><input type="checkbox" checked={destinationChecked} onChange={(e) => setDestinationChecked(e.target.checked)} /> Destination and attribution status reviewed</label><label><input type="checkbox" checked={exported} onChange={(e) => setExported(e.target.checked)} /> Final campaign package generated</label></div>
        <div className="campaign-export-actions"><button type="button" className="workspace-action" onClick={exportPackage}>Download campaign package</button><button type="button" className="workspace-action workspace-action--secondary" onClick={() => void navigator.clipboard.writeText(finalPackage)}>Copy campaign package</button></div>
        <p className="workspace-note">The package is generated locally. It does not send messages, create CRM contacts, or record campaign activity. A stored destination is not evidence of click tracking or downstream referral receipt.</p>
      </section>
    </>}
  </div>;
}
