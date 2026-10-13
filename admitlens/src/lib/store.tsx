"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { FundingRecord } from "./grantscout";
import { EMPTY_PROFILE, type Profile, type SavedEssay, type TrackerEntry } from "./types";

export type Goal = "scholarships" | "admissions" | "essays" | "roadmap";
export interface User {
  id: string;
  email: string;
  name: string;
}
export type SaveState = "idle" | "saving" | "saved" | "error";

interface Snapshot {
  profile: Profile;
  tracker: TrackerEntry[];
  essays: SavedEssay[];
  dreamCollege: string | null;
  roadmapDone: Record<string, boolean>;
  customAwards: FundingRecord[];
  goals: Goal[];
  onboarded: boolean;
  programs: Record<string, string>; // collegeId → chosen school/program id
}

interface Store extends Snapshot {
  ready: boolean;
  user: User | null;
  accountsAvailable: boolean;
  saveState: SaveState;
  setProfile: (p: Profile | ((prev: Profile) => Profile)) => void;
  setTracker: (t: TrackerEntry[] | ((prev: TrackerEntry[]) => TrackerEntry[])) => void;
  setEssays: (e: SavedEssay[] | ((prev: SavedEssay[]) => SavedEssay[])) => void;
  setDreamCollege: (id: string | null) => void;
  toggleRoadmap: (id: string) => void;
  setCustomAwards: (a: FundingRecord[] | ((prev: FundingRecord[]) => FundingRecord[])) => void; // the student's own GrantScout finds
  setGoals: (g: Goal[]) => void;
  setOnboarded: (v: boolean) => void;
  setProgram: (collegeId: string, programId: string | null) => void;
  profileComplete: number; // 0–100
  resetAll: () => void;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);
const ANON_KEY = "admitlens:v1"; // answers given before an account exists
const userKey = (id: string) => `admitlens:u:${id}`; // per-account cache for fast, offline-tolerant loads

const EMPTY: Snapshot = { profile: EMPTY_PROFILE, tracker: [], essays: [], dreamCollege: null, roadmapDone: {}, customAwards: [], goals: [], onboarded: false, programs: {} };

function readLocal(key: string): Partial<Snapshot> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeLocal(key: string, s: Snapshot) {
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {
    /* storage unavailable (private mode); app keeps working in memory */
  }
}
function removeLocal(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
const normalize = (d: Partial<Snapshot> | null | undefined): Snapshot => ({
  ...EMPTY,
  ...(d ?? {}),
  profile: { ...EMPTY_PROFILE, ...(d?.profile ?? {}) },
});

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

async function postJSON(url: string, body?: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accountsAvailable, setAccountsAvailable] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  // Server saves start only after this account's data has loaded, so an empty screen never overwrites it.
  const syncedFor = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAccount = useCallback(async (u: User, fallback?: Snapshot) => {
    try {
      const res = await fetch("/api/account", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const { data } = await res.json();
      if (data) setSnap(normalize(data));
      else if (fallback) setSnap(fallback); // account exists but nothing saved yet: keep what they just entered
    } catch {
      setSnap(normalize(readLocal(userKey(u.id)))); // offline: last copy on this device
    }
    syncedFor.current = u.id;
  }, []);

  useEffect(() => {
    (async () => {
      const anon = normalize(readLocal(ANON_KEY));
      setSnap(anon);
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const d = await res.json();
        setAccountsAvailable(d.accounts !== false);
        if (d.user) {
          setUser(d.user);
          await loadAccount(d.user);
        }
      } catch {
        /* offline: continue with local data */
      }
      setReady(true);
    })();
  }, [loadAccount]);

  // Persist: locally always, and to the account (debounced) when signed in.
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      writeLocal(ANON_KEY, snap);
      return;
    }
    if (syncedFor.current !== user.id) return;
    writeLocal(userKey(user.id), snap);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/account", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snap) });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 700);
  }, [ready, user, snap]);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const { ok, data } = await postJSON("/api/auth/signup", { email, password, name, data: snap });
      if (!ok) return data.error ?? "Couldn't create your account.";
      syncedFor.current = data.user.id;
      setUser(data.user);
      removeLocal(ANON_KEY);
      return null;
    },
    [snap],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { ok, data } = await postJSON("/api/auth/signin", { email, password });
      if (!ok) return data.error ?? "Couldn't sign you in.";
      const current = snap;
      syncedFor.current = null;
      setUser(data.user);
      await loadAccount(data.user, current.onboarded || current.profile.name ? current : undefined);
      removeLocal(ANON_KEY);
      return null;
    },
    [snap, loadAccount],
  );

  const signOut = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await postJSON("/api/auth/signout").catch(() => null);
    if (user) removeLocal(userKey(user.id)); // shared computers: don't leave the profile behind
    syncedFor.current = null;
    setUser(null);
    setSnap(EMPTY);
    removeLocal(ANON_KEY);
    setSaveState("idle");
  }, [user]);

  const field = useCallback(
    <K extends keyof Snapshot>(k: K) =>
      (v: Snapshot[K] | ((prev: Snapshot[K]) => Snapshot[K])) =>
        setSnap((s) => ({ ...s, [k]: typeof v === "function" ? (v as (p: Snapshot[K]) => Snapshot[K])(s[k]) : v })),
    [],
  );
  const setters = useMemo(
    () => ({
      setProfile: field("profile"),
      setTracker: field("tracker"),
      setEssays: field("essays"),
      setDreamCollege: field("dreamCollege") as (id: string | null) => void,
      setCustomAwards: field("customAwards"),
      setGoals: field("goals") as (g: Goal[]) => void,
      setOnboarded: field("onboarded") as (v: boolean) => void,
      setProgram: (collegeId: string, programId: string | null) =>
        setSnap((s) => {
          const programs = { ...s.programs };
          if (programId) programs[collegeId] = programId;
          else delete programs[collegeId];
          return { ...s, programs };
        }),
      toggleRoadmap: (id: string) => setSnap((s) => ({ ...s, roadmapDone: { ...s.roadmapDone, [id]: !s.roadmapDone[id] } })),
      resetAll: () => setSnap((s) => ({ ...EMPTY, goals: s.goals, onboarded: s.onboarded })),
    }),
    [field],
  );

  const value = useMemo<Store>(
    () => ({ ...snap, ...setters, ready, user, accountsAvailable, saveState, profileComplete: completeness(snap.profile), signUp, signIn, signOut }),
    [snap, setters, ready, user, accountsAvailable, saveState, signUp, signIn, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
