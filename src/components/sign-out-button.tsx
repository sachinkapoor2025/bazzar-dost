"use client";

import { buttonClass } from "@/components/ui";

export function SignOutButton() {
  return (
    <button
      type="button"
      className={`${buttonClass("ghost")} mt-3 w-full`}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Log out
    </button>
  );
}
