"use client";

import { useEffect } from "react";

const scriptLoads = new Map<string, Promise<void>>();

type LegacyScriptsProps = {
  paths: string[];
};

export function LegacyScripts({ paths }: LegacyScriptsProps) {
  useEffect(() => {
    let cancelled = false;

    async function loadScripts() {
      for (const path of paths) {
        if (cancelled) return;

        let loading = scriptLoads.get(path);
        if (!loading) {
          const existing = Array.from(
            document.querySelectorAll<HTMLScriptElement>("script[data-legacy-source]"),
          ).find((script) => script.dataset.legacySource === path);
          if (existing?.dataset.loaded === "true") continue;

          loading = new Promise<void>((resolve, reject) => {
            const script = existing || document.createElement("script");
            script.src = path;
            script.async = false;
            script.dataset.legacySource = path;
            script.onload = () => {
              script.dataset.loaded = "true";
              resolve();
            };
            script.onerror = () => reject(new Error(`Unable to load ${path}`));
            if (!existing) document.body.append(script);
          });
          scriptLoads.set(path, loading);
        }
        await loading;
      }

      if (!cancelled) {
        document.dispatchEvent(new Event("DOMContentLoaded"));
      }
    }

    loadScripts().catch((error: unknown) => {
      console.error("Partner Command page initialization failed.", error);
    });

    return () => {
      cancelled = true;
    };
  }, [paths]);

  return null;
}
