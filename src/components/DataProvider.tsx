"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EXAMPLE, score, type Inputs, type Result } from "@/lib/engine";
import { load, save } from "@/lib/store";

export type Mode = "example" | "yours";

type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  /** The inputs the checks are showing. */
  data: Inputs;
  result: Result;
  yours: Inputs;
  updateYours: (f: (x: Inputs) => Inputs) => void;
  resetYours: () => void;
};

const DataContext = createContext<Ctx | null>(null);

// Raise when the shape of Inputs changes, so an older saved entry is ignored instead of misread.
const VERSION = 1;
type Saved = { mode: Mode; yours: Inputs };

const copy = (x: Inputs): Inputs => JSON.parse(JSON.stringify(x));

export function DataProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("example");
  const [yours, setYours] = useState<Inputs>(() => copy(EXAMPLE));
  const [loaded, setLoaded] = useState(false);

  // Saved numbers are read after mount, because storage does not exist during prerender.
  useEffect(() => {
    const saved = load<Saved | null>("inputs", null, VERSION);
    if (saved && saved.yours && Array.isArray(saved.yours.quarters)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setYours(saved.yours);
      setModeState(saved.mode === "yours" ? "yours" : "example");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) save<Saved>("inputs", { mode, yours }, VERSION);
  }, [loaded, mode, yours]);

  const setMode = useCallback((m: Mode) => setModeState(m), []);
  const updateYours = useCallback((f: (x: Inputs) => Inputs) => {
    setYours((prev) => f(prev));
    setModeState("yours");
  }, []);
  const resetYours = useCallback(() => setYours(copy(EXAMPLE)), []);

  const data = mode === "yours" ? yours : EXAMPLE;
  const result = useMemo(() => score(data), [data]);
  const value = useMemo(() => ({ mode, setMode, data, result, yours, updateYours, resetYours }), [mode, setMode, data, result, yours, updateYours, resetYours]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): Ctx {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
