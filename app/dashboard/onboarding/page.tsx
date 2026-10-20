import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Circle, ExternalLink } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getPartnerProfile } from "@/lib/dashboard-data";
import { buildOnboardingSteps, onboardingProgress } from "@/lib/partner-onboarding";

export const metadata: Metadata = { title: "Partner onboarding", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { session, profile } = await getPartnerProfile();
  if (!profile) return <WorkspaceShell mode="partner" organization={session.organizationName}>
    <div className="workspace-title-row"><div><span className="workspace-kicker">ACTIVATION</span><h1>Onboarding</h1><p>Connect an approved partner record to unlock your workspace.</p></div></div>
    <div className="empty-state"><strong>Partner access is not linked</strong><p>Use the verified contact email on your active partner record to claim access. An operator can review records that do not match.</p><Link href="/auth/no-access">Review account access <ArrowRight size={15} /></Link></div>
  </WorkspaceShell>;

  const steps = buildOnboardingSteps({ linked: true, phone: profile.phone, websiteUrl: profile.websiteUrl, serviceArea: profile.serviceArea, linkCount: profile.linkCount, referralCount: profile.referralCount });
  const progress = onboardingProgress(steps);
  const next = steps.find((step) => !step.complete);
  return <WorkspaceShell mode="partner" name={profile.name} organization={session.organizationName}>
    <div className="workspace-title-row"><div><span className="workspace-kicker">PARTNER ACTIVATION</span><h1>Get ready to refer</h1><p>Your next actions are based on your live partner account.</p></div><Link className="workspace-action" href={next?.href || "/dashboard"}>{next ? "Continue setup" : "Open dashboard"}<ArrowRight size={16} /></Link></div>
    <div className="onboarding-summary">
      <div><span className="workspace-kicker">SETUP PROGRESS</span><strong>{progress.completed} of {progress.total} complete</strong><p>{next ? next.detail : "Your core partner tools are ready."}</p><div className="onboarding-progress" role="progressbar" aria-label="Onboarding progress" aria-valuenow={progress.completed} aria-valuemin={0} aria-valuemax={progress.total}><span style={{ width: `${progress.completed / progress.total * 100}%` }} /></div></div>
      <div><span className="workspace-kicker">APPLICATION</span><strong>{profile.application ? profile.application.status.replaceAll("_", " ") : "No linked application"}</strong><p>{profile.application ? `Received ${new Date(profile.application.receivedAt).toLocaleDateString("en-US", { timeZone: "UTC" })}. Status updates reflect operator review.` : "Your active partner record is linked. If an earlier application should appear here, ask an operator to connect it."}</p></div>
    </div>
    <section className="workspace-section onboarding-section" aria-labelledby="onboarding-steps"><div className="workspace-section__head"><h2 id="onboarding-steps">Your checklist</h2><span className="onboarding-section__count">{progress.completed}/{progress.total}</span></div><div className="onboarding-steps">{steps.map((step, index) => <Link className={`onboarding-step ${step.complete ? "onboarding-step--complete" : ""}`} href={step.href} key={step.id}><span className="onboarding-step__number">{step.complete ? <Check size={17} /> : String(index + 1).padStart(2, "0")}</span><span><strong>{step.title}</strong><small>{step.detail}</small></span><span className="onboarding-step__status">{step.complete ? "Complete" : "Open"}{step.complete ? <Check size={15} /> : <Circle size={12} />}</span></Link>)}</div></section>
    <div className="onboarding-links"><Link href="/resources"><span>LEARN</span><strong>Partner resources</strong><small>Explore training and tools before your first introduction.</small><ExternalLink size={17} /></Link><Link href="/compliance"><span>GUIDANCE</span><strong>Disclosure and consent</strong><small>Review the rules for sharing links and client details.</small><ExternalLink size={17} /></Link></div>
  </WorkspaceShell>;
}
