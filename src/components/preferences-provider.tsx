"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isCurrencyCode, type CurrencyCode } from "@/lib/money";

export type DeliveryLocation = { city: string; pincode: string };

type PreferencesValue = {
  ready: boolean;
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  location: DeliveryLocation | null;
  setLocation: (location: DeliveryLocation | null) => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);
const KEY = "bazaardost.preferences.v1";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");
  const [location, setLocationState] = useState<DeliveryLocation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "{}") as { currency?: string; location?: DeliveryLocation | null };
      if (parsed.currency && isCurrencyCode(parsed.currency)) setCurrencyState(parsed.currency);
      if (parsed.location && parsed.location.city && /^\d{6}$/.test(parsed.location.pincode)) setLocationState(parsed.location);
    } catch {
      setCurrencyState("INR");
      setLocationState(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ currency, location }));
  }, [currency, location, ready]);

  const value = useMemo<PreferencesValue>(
    () => ({
      ready,
      currency,
      setCurrency: setCurrencyState,
      location,
      setLocation: setLocationState,
    }),
    [ready, currency, location],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}
