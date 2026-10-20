import Link from "next/link";

export function Brand({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link className={`brand ${compact ? "brand--compact" : ""}`} href={href} aria-label="Partner Command home">
      <span className="brand__mark" aria-hidden="true">PC<span>.</span></span>
      {!compact && <span className="brand__wordmark">PARTNER<br />COMMAND</span>}
    </Link>
  );
}
