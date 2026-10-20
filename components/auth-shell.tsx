import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/brand";

export function AuthShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <main className="auth-shell"><section className="auth-shell__main"><div className="auth-shell__brand"><Brand /><Link href="/">Public site <ArrowUpRight size={15} /></Link></div><div className="auth-shell__content"><span className="workspace-kicker">{eyebrow}</span><h1>{title}</h1>{children}</div><p className="auth-shell__foot">Partner Command · Distilled Funding</p></section><aside className="auth-shell__aside" aria-label="Partner workflow"><span>PARTNER OPERATIONS / 01</span><div><strong>Your next move,<br />in one place.</strong><p>Access your partner record, make a verified introduction, and see the next action.</p><ol><li>Connect your account</li><li>Prepare your partner tools</li><li>Track the work</li></ol></div><span>MOONSHINE CAPITAL</span></aside></main>;
}
