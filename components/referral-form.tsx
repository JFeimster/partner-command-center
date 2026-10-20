import { randomUUID } from "node:crypto";
import { submitPartnerReferral } from "@/lib/actions";

export function ReferralForm() {
  return (
    <form action={submitPartnerReferral} className="portal-form">
      <input type="hidden" name="request_id" value={randomUUID()} />
      <div className="portal-form__grid">
        <label>Business name<input className="portal-field" name="business_name" required minLength={2} maxLength={160} autoComplete="organization" /></label>
        <label>Contact name<input className="portal-field" name="contact_name" required minLength={2} maxLength={160} autoComplete="name" /></label>
        <label>Contact email<input className="portal-field" name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label>Contact phone <span className="portal-form__optional">Optional</span><input className="portal-field" name="phone" type="tel" maxLength={40} autoComplete="tel" /></label>
      </div>
      <label className="portal-consent"><input type="checkbox" name="consent_confirmed" required /><span>I have permission to share this contact’s information for a funding readiness review.</span></label>
      <button className="button button--yellow" type="submit">Submit referral</button>
      <p className="workspace-note">This records a referral for human review. It does not submit a funding application or guarantee an offer.</p>
    </form>
  );
}
