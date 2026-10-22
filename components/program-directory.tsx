"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import type { Program } from "@/lib/program-catalog";

export function ProgramDirectory({ programs }: { programs: Program[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const categories = useMemo(() => ["All categories", ...new Set(programs.flatMap((program) => program.category))].sort((a, b) => a === "All categories" ? -1 : b === "All categories" ? 1 : a.localeCompare(b)), [programs]);
  const visible = useMemo(() => programs.filter((program) => {
    const matchesCategory = category === "All categories" || program.category.includes(category);
    const haystack = [program.name, program.description, ...program.useCases, ...program.industries, ...program.products].join(" ").toLowerCase();
    return matchesCategory && haystack.includes(search.trim().toLowerCase());
  }), [programs, search, category]);

  return <section aria-labelledby="program-directory-title">
    <div className="interior-section-head"><div><span className="eyebrow">SOURCE BACKED</span><h2 id="program-directory-title">Available programs</h2></div><p>{programs.length} active registry entries. Availability and referral access still require current partner review.</p></div>
    <div className="catalog-controls"><label><Search size={18} aria-hidden="true"/><span className="sr-only">Search programs</span><input type="search" placeholder="Search programs, use cases, products" value={search} onChange={(event) => setSearch(event.target.value)}/></label><label><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <p className="catalog-count" role="status">Showing {visible.length} of {programs.length} programs</p>
    {visible.length ? <div className="directory-list">{visible.map((program, index) => <article className="directory-row" key={program.id}><span className="directory-row__number">{String(index + 1).padStart(2, "0")}</span><div><span className="directory-row__type">{program.category.join(" / ") || "PROGRAM"}</span><h3>{program.name}</h3></div><p>{program.description || program.useCases.slice(0, 2).join(" · ") || "Review the program details and available partner actions."}</p><Link href={`/marketplace/${program.id}`} aria-label={`View ${program.name}`}><ArrowUpRight size={23}/></Link></article>)}</div> : <p className="catalog-empty">No programs match those filters. Try a broader category or search term.</p>}
  </section>;
}
