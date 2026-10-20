import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";

const publicLinks = [
  ["Marketplace", "/marketplace"],
  ["Resources", "/resources"],
  ["Partner rules", "/compliance"],
] as const;

export function PublicHeader() {
  return (
    <header className="public-header">
      <div className="public-header__inner">
        <Brand />
        <nav className="public-header__nav" aria-label="Primary navigation">
          {publicLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="public-header__action">
          <Link className="button button--yellow button--small" href="/dashboard">Open workspace <ArrowUpRight size={17} /></Link>
        </div>
        <details className="public-menu">
          <summary aria-label="Open navigation">Menu <span aria-hidden="true">☰</span></summary>
          <nav aria-label="Mobile navigation">
            {publicLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            <Link href="/partner-access">Partner access</Link>
            <Link href="/dashboard">Open workspace</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer__top">
        <Brand />
        <p>The operating workspace for Distilled Funding partners.</p>
      </div>
      <div className="public-footer__bottom">
        <span>© {new Date().getFullYear()} Partner Command</span>
        <nav aria-label="Footer navigation">
          <Link href="/about">About</Link><Link href="/affiliate-disclosure">Disclosure</Link>
          <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

export function PublicPage({ children }: { children: React.ReactNode }) {
  return <><a className="skip-link" href="#main">Skip to content</a><PublicHeader /><main id="main">{children}</main><PublicFooter /></>;
}
