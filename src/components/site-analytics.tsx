"use client";

import { useEffect, useState } from "react";
import { GA_MEASUREMENT_ID, META_PIXEL_ID, analyticsConfigured } from "@/lib/analytics";

const CONSENT_KEY = "bazaardost-analytics";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  __bazaardostAnalytics?: boolean;
};

function granted(): boolean {
  return window.localStorage.getItem(CONSENT_KEY) === "granted";
}

function loadScripts() {
  const win = window as AnalyticsWindow;
  if (win.__bazaardostAnalytics) return;
  win.__bazaardostAnalytics = true;
  if (GA_MEASUREMENT_ID) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);
    win.dataLayer = win.dataLayer || [];
    win.gtag = function gtag(...args: unknown[]) {
      win.dataLayer?.push(args);
    };
    win.gtag("js", new Date());
    win.gtag("config", GA_MEASUREMENT_ID);
  }
  if (META_PIXEL_ID && /^\d{5,20}$/.test(META_PIXEL_ID)) {
    const script = document.createElement("script");
    script.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`;
    document.head.appendChild(script);
  }
}

export function trackStoreEvent(name: "view_item" | "add_to_cart" | "begin_checkout" | "purchase", params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !granted()) return;
  const win = window as AnalyticsWindow;
  const pixelName = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase" }[name];
  win.gtag?.("event", name, params);
  win.fbq?.("track", pixelName, params);
}

export function SiteAnalytics() {
  const [choice, setChoice] = useState<"unknown" | "granted" | "denied">("unknown");
  useEffect(() => {
    if (!analyticsConfigured()) return;
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored === "granted") {
      setChoice("granted");
      loadScripts();
    } else if (stored === "denied") {
      setChoice("denied");
    }
  }, []);
  if (!analyticsConfigured() || choice !== "unknown") return null;
  return (
    <div className="fixed inset-x-3 bottom-24 z-40 rounded-2xl border border-cream-300 bg-white p-3 text-sm shadow-card md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <p className="leading-6">Analytics cookies are off until you allow them. They are used to count product views, cart adds, checkout, and purchases.</p>
      <div className="mt-2 flex gap-2">
        <button type="button" className="rounded-full bg-forest-800 px-3 py-2 font-semibold text-cream-50" onClick={() => { window.localStorage.setItem(CONSENT_KEY, "granted"); setChoice("granted"); loadScripts(); }}>Allow</button>
        <button type="button" className="rounded-full border border-cream-300 px-3 py-2 font-semibold" onClick={() => { window.localStorage.setItem(CONSENT_KEY, "denied"); setChoice("denied"); }}>Decline</button>
      </div>
    </div>
  );
}
