"use client";

import { useId, useState } from "react";
import { usePreferences } from "@/components/preferences-provider";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { CURRENCIES } from "@/lib/money";

export function StoreControls() {
  return (
    <div className="flex items-center gap-2">
      <LocationButton />
      <CurrencyButton />
    </div>
  );
}

function LocationButton() {
  const { location, setLocation } = usePreferences();
  const dialogId = useId();
  const cityId = useId();
  const pinId = useId();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(location?.city || "");
  const [pincode, setPincode] = useState(location?.pincode || "");
  const [error, setError] = useState("");

  function openDialog() {
    setCity(location?.city || "");
    setPincode(location?.pincode || "");
    setError("");
    setOpen(true);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    const nextCity = city.trim();
    const nextPin = pincode.trim();
    if (nextCity.length < 2) {
      setError("Enter a city.");
      return;
    }
    if (!/^\d{6}$/.test(nextPin)) {
      setError("Enter a 6-digit PIN code.");
      return;
    }
    setLocation({ city: nextCity.slice(0, 40), pincode: nextPin });
    setOpen(false);
  }

  return (
    <>
      <button type="button" className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold hover:bg-cream-200" onClick={openDialog}>
        {location ? `Deliver to ${location.city}` : "Select delivery location"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-forest-950/50 p-4" role="presentation" onClick={() => setOpen(false)}>
          <form
            id={dialogId}
            role="dialog"
            aria-labelledby={`${dialogId}-title`}
            className="w-[min(100%,24rem)] rounded-2xl bg-cream-50 p-4 text-ink"
            onClick={(event) => event.stopPropagation()}
            onSubmit={save}
          >
            <h2 id={`${dialogId}-title`} className="font-display text-2xl text-forest-900">Delivery location</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Saved on this device and filled in at checkout. Shipping is still calculated there. This does not check courier coverage.</p>
            <label htmlFor={cityId} className={`${labelClass} mt-4`}>City</label>
            <input id={cityId} className={fieldClass} value={city} maxLength={40} onChange={(event) => setCity(event.target.value)} />
            <label htmlFor={pinId} className={`${labelClass} mt-3`}>PIN code</label>
            <input id={pinId} className={fieldClass} inputMode="numeric" value={pincode} maxLength={6} onChange={(event) => setPincode(event.target.value)} />
            {error ? <p role="alert" className="mt-2 text-sm text-[#7F1D1D]">{error}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="submit" className={buttonClass("primary")}>Save location</button>
              <button
                type="button"
                className={buttonClass("ghost")}
                onClick={() => {
                  setLocation(null);
                  setOpen(false);
                }}
              >
                Clear
              </button>
              <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)}>Close</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function CurrencyButton() {
  const { currency, setCurrency } = usePreferences();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold hover:bg-cream-200"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        Currency: {currency}
      </button>
      {open ? (
        <div id={menuId} className="absolute right-0 top-full z-30 w-56 rounded-2xl border border-cream-300 bg-white p-2 shadow-card">
          <p className="px-2 py-1 text-xs leading-5 text-muted">Approximate display rates. Checkout charges Indian rupees.</p>
          {CURRENCIES.map((item) => (
            <button
              key={item.code}
              type="button"
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-cream-100"
              aria-pressed={currency === item.code}
              onClick={() => {
                setCurrency(item.code);
                setOpen(false);
              }}
            >
              {item.code} · {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
