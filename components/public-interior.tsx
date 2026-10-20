import { PublicPage } from "./public-shell";

export function PublicInterior({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return <PublicPage><section className="interior-hero"><div className="interior-hero__inner"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></section><div className="interior-content">{children}</div></PublicPage>;
}
