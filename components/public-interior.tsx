import { PublicPage } from "./public-shell";

export function PublicInterior({ eyebrow, title, intro, children, compactHero = false }: { eyebrow: string; title: string; intro: string; children: React.ReactNode; compactHero?: boolean }) {
  return <PublicPage><section className={`interior-hero${compactHero ? " interior-hero--compact" : ""}`}><div className="interior-hero__inner"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></section><div className="interior-content">{children}</div></PublicPage>;
}
