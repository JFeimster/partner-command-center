"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { partnerResources } from "@/lib/resource-catalog";

const audiences = ["All partner types", "Funding brokers", "Referral partners", "Affiliate partners", "Centers of influence", "Community connectors", "Operators"];

export function ResourceLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All resources");
  const [audience, setAudience] = useState("All partner types");
  const categories = ["All resources", ...new Set(partnerResources.map((resource) => resource.category))];
  const visibleResources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return partnerResources.filter((resource) => {
      const matchesQuery = !normalized || [resource.title, resource.description, resource.category, ...resource.keywords].join(" ").toLowerCase().includes(normalized);
      const matchesCategory = category === "All resources" || resource.category === category;
      const matchesAudience = audience === "All partner types" || resource.audience.includes(audience) || resource.audience.includes("All partner types");
      return matchesQuery && matchesCategory && matchesAudience;
    });
  }, [audience, category, query]);

  return <>
    <div className="resource-controls" aria-label="Filter resources">
      <label className="resource-search"><Search size={17} aria-hidden="true"/><span className="sr-only">Search resources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guides, tools, programs…" /></label>
      <label className="resource-select"><SlidersHorizontal size={16} aria-hidden="true"/><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="resource-select resource-select--audience"><span className="sr-only">Filter by partner type</span><select value={audience} onChange={(event) => setAudience(event.target.value)}>{audiences.map((item) => <option key={item}>{item}</option>)}</select></label>
      <span className="resource-count" aria-live="polite">{visibleResources.length} {visibleResources.length === 1 ? "resource" : "resources"}</span>
    </div>
    {visibleResources.length ? <div className="resource-grid">{visibleResources.map((resource, index) => <article className="resource-card" key={resource.id}>
      <div className="resource-card__top"><span className="resource-card__index">{String(index + 1).padStart(2, "0")}</span><span className="resource-card__category">{resource.category}</span></div>
      <h3>{resource.title}</h3>
      <p>{resource.description}</p>
      <div className="resource-card__audience"><span>Useful for</span><div>{resource.audience.map((item) => <span key={item}>{item}</span>)}</div></div>
      <Link href={resource.href} className="resource-card__action">{resource.action}<ArrowUpRight size={17} aria-hidden="true"/></Link>
    </article>)}</div> : <div className="resource-empty" role="status"><h3>No matching resources</h3><p>Try a broader search or clear one of the filters.</p><button type="button" onClick={() => { setQuery(""); setCategory("All resources"); setAudience("All partner types"); }}>Clear filters</button></div>}
  </>;
}
