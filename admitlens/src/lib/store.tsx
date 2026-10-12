"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FundingRecord } from "./grantscout";
import { EMPTY_PROFILE, type Profile, type SavedEssay, type TrackerEntry } from "./types";

interface Store {
  ready: boolean;
  profile: Profile;
  setProfile: (p: Profile | ((prev: Profile) => Profile)) => void;
  tracker: TrackerEntry[];
  setTracker: (t: TrackerEntry[] | ((prev: TrackerEntry[]) => TrackerEntry[])) => void;
  essays: SavedEssay[];
  setEssays: (e: SavedEssay[] | ((prev: SavedEssay[]) => SavedEssay[])) => void;
  dreamCollege: string | null;
  setDreamCollege: (id: string | null) => void;
  roadmapDone: Record<string, boolean>;
  toggleRoadmap: (id: string) => void;
  customAwards: FundingRecord[]; // awards the student found themselves (their local GrantScout library)
  setCustomAwards: (a: FundingRecord[] | ((prev: FundingRecord[]) => FundingRecord[])) => void;
  profileComplete: number; // 0–100
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);
const KEY = "admitlens:v1";

function load(): Partial<{ profile: Profile; tracker: TrackerEntry[]; essays: SavedEssay[]; dreamCollege: string | null; roadmapDone: Record<string, boolean>; customAwards: FundingRecord[] }> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function completeness(p: Profile) {
  const checks = [
    !!p.name,
    p.gpaUnweighted != null || p.gpaWeighted != null,
    p.apCount > 0 || p.rigor !== 3,
    p.sat != null || p.act != null || !p.submitTests,
    p.activities.length >= 3,
    p.awards.length > 0,
    p.personalStatement.trim().split(/\s+/).length >= 150,
    p.recs !== "unknown",
    !!p.intendedMajor,
    !!p.state,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [tracker, setTracker] = useState<TrackerEntry[]>([]);
  const [essays, setEssays] = useState<SavedEssay[]>([]);
  const [dreamCollege, setDreamCollege] = useState<string | null>(null);
  const [roadmapDone, setRoadmapDone] = useState<Record<string, boolean>>({});
  const [customAwards, setCustomAwards] = useState<FundingRecord[]>([]);

  useEffect(() => {
    const d = load();
    if (d.profile) setProfile({ ...EMPTY_PROFILE, ...d.profile });
    if (d.tracker) setTracker(d.tracker);
    if (d.essays) setEssays(d.essays);
    if (d.dreamCollege) setDreamCollege(d.dreamCollege);
    if (d.roadmapDone) setRoadmapDone(d.roadmapDone);
    if (d.customAwards) setCustomAwards(d.customAwards);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ profile, tracker, essays, dreamCollege, roadmapDone, customAwards }));
    } catch {
      /* storage unavailable (private mode); app keeps working in memory */
    }
  }, [ready, profile, tracker, essays, dreamCollege, roadmapDone, customAwards]);

  const toggleRoadmap = useCallback((id: string) => setRoadmapDone((d) => ({ ...d, [id]: !d[id] })), []);
  const resetAll = useCallback(() => {
    setProfile(EMPTY_PROFILE);
    setTracker([]);
    setEssays([]);
    setDreamCollege(null);
    setRoadmapDone({});
    setCustomAwards([]);
  }, []);

  const value = useMemo<Store>(
    () => ({ ready, profile, setProfile, tracker, setTracker, essays, setEssays, dreamCollege, setDreamCollege, roadmapDone, toggleRoadmap, customAwards, setCustomAwards, profileComplete: completeness(profile), resetAll }),
    [ready, profile, tracker, essays, dreamCollege, roadmapDone, toggleRoadmap, customAwards, resetAll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
