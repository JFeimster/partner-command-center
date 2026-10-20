const FORM_ID = "mOe658";
const PASS_THROUGH = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "partner_id", "partner", "ref", "affiliate", "affiliate_id", "source", "offer"];

export function TallyIntake({ attribution = {} }: { attribution?: Record<string, string> }) {
  const embed = new URL(`https://tally.so/embed/${FORM_ID}`);
  embed.searchParams.set("alignLeft", "1");
  embed.searchParams.set("hideTitle", "1");
  embed.searchParams.set("transparentBackground", "1");
  const direct = new URL(`https://tally.so/r/${FORM_ID}`);
  for (const key of PASS_THROUGH) {
    const value = attribution[key];
    if (value && value.length <= 150) { embed.searchParams.set(key, value); direct.searchParams.set(key, value); }
  }

  return <div className="intake-form"><iframe src={embed.href} loading="lazy" title="Partner application form" width="100%" height="650" referrerPolicy="strict-origin-when-cross-origin" /><p>If the form does not load, <a href={direct.href} target="_blank" rel="noopener noreferrer">open the full application form ↗</a>.</p></div>;
}
