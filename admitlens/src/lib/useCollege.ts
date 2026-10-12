"use client";
import { useEffect, useState } from "react";
import { getCollege, type College } from "@/data/colleges";

const cache = new Map<string, College>();

export function rememberCollege(c: College) {
  if (c.source === "scorecard") {
    cache.set(c.id, c);
    try {
      sessionStorage.setItem(`admitlens:sc:${c.id}`, JSON.stringify(c));
    } catch {}
  }
}

/** Resolves a college id from the bundled dataset, or live from College Scorecard ("sc-…"). */
export function useCollege(id: string | null | undefined) {
  const [college, setCollege] = useState<College | null>(() => (id ? getCollege(id) ?? cache.get(id) ?? null : null));
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!id) return setCollege(null);
    const local = getCollege(id) ?? cache.get(id);
    if (local) return setCollege(local);
    try {
      const s = sessionStorage.getItem(`admitlens:sc:${id}`);
      if (s) return setCollege(JSON.parse(s));
    } catch {}
    if (!id.startsWith("sc-")) return setCollege(null);
    setLoading(true);
    fetch(`/api/scorecard?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        const c = d.results?.[0] ?? null;
        if (c) rememberCollege(c);
        setCollege(c);
      })
      .catch(() => setCollege(null))
      .finally(() => setLoading(false));
  }, [id]);
  return { college, loading };
}

export function useAiStatus() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => setEnabled(false));
  }, []);
  return enabled;
}
