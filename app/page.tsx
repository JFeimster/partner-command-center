import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, MoveUpRight } from "lucide-react";
import { PublicPage } from "@/components/public-shell";

export default function HomePage() {
  return (
    <PublicPage>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__inner">
          <div className="home-hero__eyebrow"><span className="signal-dot" /> DISTILLED FUNDING / PARTNER OPERATIONS</div>
          <h1 id="home-title"><span>PARTNER</span><span>COMMAND<span className="home-hero__period">.</span></span></h1>
          <div className="home-hero__bottom">
            <div className="home-hero__copy"><p>Leads. Links. Resources.<br /><strong>The next move, in one place.</strong></p><span>An operating workspace for partners already in motion.</span></div>
            <div className="home-hero__actions"><Link className="button button--yellow" href="/dashboard">Open workspace <ArrowUpRight size={20} /></Link><Link className="button button--line" href="/partner-access">Get partner access <ArrowRight size={18} /></Link></div>
          </div>
        </div>
        <div className="home-hero__rail" aria-hidden="true"><span>OPERATE WITH CLARITY</span><span>01 / 03</span></div>
      </section>

      <section className="home-workflow page-section" aria-labelledby="workflow-title">
        <div className="section-head"><span className="eyebrow">01 / THE WORKSPACE</span><h2 id="workflow-title">Keep the work<br /><em>moving.</em></h2><p>See the record, understand its status, and act on the next verified step.</p></div>
        <div className="workflow-track" aria-label="Partner workflow">
          <article><span className="workflow-track__index">01</span><div><h3>Capture</h3><p>Bring referrals and partner activity into the workspace.</p></div><ArrowDownRight aria-hidden="true" size={24} /></article>
          <article><span className="workflow-track__index">02</span><div><h3>Review</h3><p>Work from the current status and requested follow-up.</p></div><ArrowDownRight aria-hidden="true" size={24} /></article>
          <article><span className="workflow-track__index">03</span><div><h3>Advance</h3><p>Share the appropriate resource or route for human review.</p></div><MoveUpRight aria-hidden="true" size={24} /></article>
        </div>
      </section>

      <section className="home-columns page-section" aria-labelledby="tools-title">
        <div className="home-columns__headline"><span className="eyebrow">02 / BUILT FOR THE DAILY LOOP</span><h2 id="tools-title">One place to find<br />what matters now.</h2></div>
        <div className="home-columns__links">
          <Link href="/marketplace"><span>Explore program paths</span><ArrowUpRight size={22} /></Link>
          <Link href="/resources"><span>Find partner resources</span><ArrowUpRight size={22} /></Link>
          <Link href="/compliance"><span>Review operating rules</span><ArrowUpRight size={22} /></Link>
        </div>
      </section>

      <section className="home-cta page-section" aria-labelledby="cta-title"><div><span className="eyebrow">03 / START HERE</span><h2 id="cta-title">Your next move<br />starts in Command.</h2></div><Link className="button button--dark" href="/partner-access">Partner access <ArrowUpRight size={20} /></Link></section>
    </PublicPage>
  );
}
