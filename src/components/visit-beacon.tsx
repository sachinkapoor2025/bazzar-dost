"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function VisitBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const key = "bazaardost-session";
    let sessionId = "";
    try {
      sessionId = sessionStorage.getItem(key) || "";
      if (!/^[a-zA-Z0-9-]{8,80}$/.test(sessionId)) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(key, sessionId);
      }
    } catch {
      return;
    }
    const width = window.innerWidth;
    const device = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
    void fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, sessionId, device }),
    }).catch(() => undefined);
  }, [pathname]);
  return null;
}
