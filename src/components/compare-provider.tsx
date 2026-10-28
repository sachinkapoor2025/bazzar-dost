"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "bazaardost.compare.v1";
const MAX = 3;

type CompareContextValue = {
  ids: string[];
  ready: boolean;
  notice: string;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
      if (Array.isArray(parsed)) setIds(parsed.filter((id) => typeof id === "string").slice(0, MAX));
    } catch {
      setIds([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids, ready]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const value = useMemo<CompareContextValue>(() => ({
    ids,
    ready,
    notice,
    toggle(id) {
      setIds((current) => {
        if (current.includes(id)) return current.filter((item) => item !== id);
        if (current.length >= MAX) {
          setNotice("Compare holds 3 products. Remove one to add another.");
          return current;
        }
        return [...current, id];
      });
    },
    remove(id) {
      setIds((current) => current.filter((item) => item !== id));
    },
    clear() {
      setIds([]);
    },
  }), [ids, notice, ready]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const value = useContext(CompareContext);
  if (!value) throw new Error("Compare is unavailable.");
  return value;
}
