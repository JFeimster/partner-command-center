import { LegacyScripts } from "../legacy-scripts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Command | Distilled Funding",
  description:
    "Partner Command is the operating workspace for Distilled Funding partners: leads, links, resources, production, and the next move.",
};

const publicScripts = [
  "/scripts/config.js",
  "/scripts/storage.js",
  "/scripts/ui-utils.js",
  "/scripts/route-utils.js",
  "/scripts/affiliate-tracking.js",
  "/scripts/analytics-lite.js",
];

const attributionKeys = [
  "partner_id",
  "partner",
  "ref",
  "affiliate",
  "affiliate_id",
  "source",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

type SearchParams = Record<string, string | string[] | undefined>;

function preserveAttribution(path: string, searchParams: SearchParams) {
  const query = new URLSearchParams();
  for (const key of attributionKeys) {
    const value = searchParams[key];
    if (typeof value === "string" && value) query.set(key, value);
  }
  const hashIndex = path.indexOf("#");
  const pathname = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex);
  const search = query.toString();
  return `${pathname}${search ? `?${search}` : ""}${hash}`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const link = (path: string) => preserveAttribution(path, query);

  return (
    <>
      <LegacyScripts paths={publicScripts} />
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="public-header">
        <div className="public-shell public-header-inner">
          <a className="public-logo" href={link("/")} data-preserve-attribution aria-label="Partner Command home">
            <span className="public-logo-mark" aria-hidden="true">PC</span>
            <span>Partner Command</span>
          </a>
          <nav className="public-nav" aria-label="Primary navigation">
            <a href={link("/marketplace")} data-preserve-attribution>Marketplace</a>
            <a href={link("/resources")} data-preserve-attribution>Resources</a>
            <a href={link("/compliance")} data-preserve-attribution>Compliance</a>
          </nav>
          <div className="public-header-actions">
            <a className="mpc-button mpc-button-primary mpc-button-sm" href={link("/dashboard")} data-preserve-attribution>
              Open Command
            </a>
          </div>
        </div>
      </header>
      <main id="main" className="public-page">
        <section className="public-hero" aria-labelledby="hero-title">
          <div className="public-shell public-hero-inner">
            <div className="public-hero-copy">
              <span className="mpc-eyebrow">Distilled Funding / Partner Operations</span>
              <h1 id="hero-title">PARTNER COMMAND.</h1>
              <p className="lead">Leads. Links. Training. Production. Next move.</p>
              <p>
                One operating surface for partners already in motion. The public
                funding-agency opportunity and recruitment experience lives
                separately from this command workspace.
              </p>
              <div className="mpc-actions">
                <a className="mpc-button mpc-button-primary mpc-button-lg" href={link("/dashboard")} data-preserve-attribution>
                  Open Partner Command
                </a>
                <a className="mpc-button mpc-button-outline mpc-button-lg" href={link("/partner-access")} data-preserve-attribution>
                  Partner Access
                </a>
              </div>
            </div>
            <aside className="public-hero-card" aria-label="Partner Command operating model">
              <span className="mpc-badge mpc-badge-warning">Operator surface</span>
              <h2 className="mt-4">WHAT NEEDS ATTENTION?</h2>
              <div className="public-proof-strip">
                <div className="public-proof-item"><strong>01 / PIPELINE</strong><span>See leads and the next required action.</span></div>
                <div className="public-proof-item"><strong>02 / GROWTH</strong><span>Deploy attributed links, assets, and widgets.</span></div>
                <div className="public-proof-item"><strong>03 / BUILD</strong><span>Use tools, resources, and operating support.</span></div>
                <div className="public-proof-item"><strong>04 / EARN</strong><span>Track production and commission context.</span></div>
              </div>
            </aside>
          </div>
        </section>
        <section className="public-section-sm" aria-labelledby="command-title">
          <div className="public-shell">
            <div className="public-section-header">
              <span className="mpc-eyebrow">Command loop</span>
              <h2 id="command-title">WHAT HAPPENED. WHAT NEEDS ATTENTION. WHAT IS THE NEXT MOVE.</h2>
              <p>Partner Command is designed to collapse operating noise into a short list of useful actions.</p>
            </div>
            <div className="mpc-grid mpc-grid-3">
              <article className="mpc-card mpc-card-pad">
                <span className="mpc-badge">PIPELINE</span><h3>Work the lead</h3>
                <p>Submit, review, and advance partner-attributed opportunities.</p>
                <a className="mpc-button mpc-button-outline" href={link("/dashboard#leads")} data-preserve-attribution>Open Leads</a>
              </article>
              <article className="mpc-card mpc-card-pad">
                <span className="mpc-badge">GROWTH</span><h3>Distribute</h3>
                <p>Use referral links and approved widgets without losing attribution.</p>
                <a className="mpc-button mpc-button-outline" href={link("/dashboard#links")} data-preserve-attribution>Open Links</a>
              </article>
              <article className="mpc-card mpc-card-pad">
                <span className="mpc-badge">BUILD</span><h3>Get the asset</h3>
                <p>Pull the script, resource, marketplace option, or tool needed for the next conversation.</p>
                <a className="mpc-button mpc-button-outline" href={link("/resources")} data-preserve-attribution>Open Resources</a>
              </article>
            </div>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <div className="public-shell public-footer-inner">
          <div>
            <a className="public-logo" href={link("/")} data-preserve-attribution><span className="public-logo-mark" aria-hidden="true">PC</span><span>Partner Command</span></a>
            <p className="mt-4">The operating workspace for Distilled Funding partners.</p>
          </div>
          <div className="public-footer-links">
            <a href={link("/dashboard")} data-preserve-attribution>Command</a><a href={link("/marketplace")} data-preserve-attribution>Marketplace</a><a href={link("/resources")} data-preserve-attribution>Resources</a>
            <a href={link("/compliance")} data-preserve-attribution>Compliance</a><a href={link("/privacy")} data-preserve-attribution>Privacy</a><a href={link("/terms")} data-preserve-attribution>Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
