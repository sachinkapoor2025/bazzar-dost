"use client";

import { useEffect } from "react";
import { trackStoreEvent } from "@/components/site-analytics";

export function TrackEvent({
  name,
  params,
}: {
  name: "view_item" | "begin_checkout" | "purchase";
  params: Record<string, string | number>;
}) {
  const signature = JSON.stringify({ name, params });
  useEffect(() => {
    const parsed = JSON.parse(signature) as { name: "view_item" | "begin_checkout" | "purchase"; params: Record<string, string | number> };
    trackStoreEvent(parsed.name, parsed.params);
  }, [signature]);
  return null;
}
