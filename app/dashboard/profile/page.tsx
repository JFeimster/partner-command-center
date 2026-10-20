import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getPartnerProfile } from "@/lib/dashboard-data";
import { updatePartnerProfile } from "@/lib/actions";

export const metadata: Metadata = { title: "Partner profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ session, profile }, params] = await Promise.all([getPartnerProfile(), searchParams]);
  if (!profile) return <WorkspaceShell mode="partner" organization={session.organizationName}>
    <div className="workspace-title-row"><div><span className="workspace-kicker">ACCOUNT</span><h1>Partner profile</h1><p>Link your approved partner record before editing business details.</p></div></div><div className="empty-state"><strong>No partner record linked</strong><p>Claim access with the verified email on your approved partner record.</p><Link href="/auth/no-access">Review account access <ArrowRight size={15} /></Link></div>
  </WorkspaceShell>;

  return <WorkspaceShell mode="partner" name={profile.name} organization={session.organizationName}>
    <div className="workspace-title-row"><div><span className="workspace-kicker">PARTNER IDENTITY</span><h1>Business profile</h1><p>Keep your contact and business context current for your partner workspace.</p></div><Link className="workspace-action workspace-action--secondary" href="/dashboard/onboarding">View onboarding <ArrowRight size={16} /></Link></div>
    {params.saved && <p className="form-notice" role="status">Business details saved to your partner record.</p>}
    {params.error && <p className="form-notice form-notice--error" role="alert">Profile could not be saved. Check the phone, secure website URL, and field lengths, then try again.</p>}
    <div className="profile-grid"><section className="workspace-section profile-identity" aria-labelledby="profile-identity-heading"><span className="workspace-kicker">VERIFIED RECORD</span><h2 id="profile-identity-heading">Partner identity</h2><dl><div><dt>Partner</dt><dd>{profile.name}</dd></div><div><dt>Contact email</dt><dd>{profile.email}</dd></div><div><dt>Partner code</dt><dd>{profile.partnerCode}</dd></div><div><dt>Status</dt><dd><span className="status-label">{profile.status}</span></dd></div></dl><p>Identity, code, and status are managed through partner operations. Contact an operator for corrections.</p></section>
    <section className="workspace-section profile-editor" aria-labelledby="profile-editor-heading"><span className="workspace-kicker">BUSINESS DETAILS</span><h2 id="profile-editor-heading">How you work</h2><p>These details are stored on your existing partner record.</p><form action={updatePartnerProfile} className="portal-form"><div className="portal-form__grid"><label>Contact phone<input className="portal-field" name="phone" type="tel" maxLength={40} autoComplete="tel" defaultValue={profile.phone} placeholder="Business phone" /></label><label>Website<input className="portal-field" name="website_url" type="url" maxLength={256} defaultValue={profile.websiteUrl} placeholder="https://yourbusiness.com" /></label></div><label>Service area<input className="portal-field" name="service_area" maxLength={120} defaultValue={profile.serviceArea} placeholder="Markets or regions you serve" /></label><label>Business summary<textarea className="portal-field profile-editor__textarea" name="business_summary" maxLength={500} defaultValue={profile.businessSummary} placeholder="Describe the clients and services you focus on" /></label><button type="submit" className="workspace-action profile-editor__submit">Save business details <ArrowRight size={16} /></button></form></section></div>
  </WorkspaceShell>;
}
