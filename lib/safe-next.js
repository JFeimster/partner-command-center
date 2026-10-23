"use strict";

const FALLBACK = "/dashboard";
const ORIGIN = "https://partner-command.invalid";

function safeNextPath(value, fallback = FALLBACK) {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\") || /[\u0000-\u001f\u007f]/.test(candidate)) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, ORIGIN);
    if (parsed.origin !== ORIGIN) return fallback;
    const decodedPath = decodeURIComponent(parsed.pathname);
    if (decodedPath.startsWith("//") || decodedPath.includes("\\") || /[\u0000-\u001f\u007f]/.test(decodedPath)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

module.exports = { safeNextPath };
