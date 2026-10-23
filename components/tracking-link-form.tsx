import { createPartnerTrackingLink } from "@/lib/actions";

export function TrackingLinkForm({ initialCampaign }: { initialCampaign?: string }) {
  return (
    <form action={createPartnerTrackingLink} className="portal-form">
      <label>Partner page URL<input className="portal-field" name="destination_url" type="url" required maxLength={2048} placeholder="https://capital.distilledfunding.com/your-page" /></label>
      <label>Campaign label <span className="portal-form__optional">Optional</span><input className="portal-field" name="campaign" maxLength={80} defaultValue={initialCampaign} placeholder="Spring outreach" /></label>
      <p className="workspace-note">The link is saved to your account and gets your partner referral code added to the URL.</p>
      <button className="button button--yellow" type="submit">Create attributed link</button>
    </form>
  );
}
