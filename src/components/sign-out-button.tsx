"use client";

import { buttonClass } from "@/components/ui";

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={`${buttonClass("ghost")} ${className}`}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Log out
    </button>
  );
}
