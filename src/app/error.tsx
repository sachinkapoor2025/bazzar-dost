"use client";

import { buttonClass } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-4xl">This page could not be loaded</h1>
      <p className="mt-3 text-sm leading-6 text-muted">The catalogue request failed. You can try it again.</p>
      <button type="button" className={`${buttonClass("primary")} mt-4`} onClick={() => reset()}>Try again</button>
    </div>
  );
}
