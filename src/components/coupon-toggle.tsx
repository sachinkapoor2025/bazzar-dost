"use client";

import { buttonClass } from "@/components/ui";

export function CouponToggle({ id, active }: { id: string; active: boolean }) {
  return (
    <button
      type="button"
      className={buttonClass("outline")}
      onClick={async () => {
        await fetch(`/api/admin/coupons/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: (document.getElementById(`code-${id}`) as HTMLElement)?.dataset.code, type: (document.getElementById(`code-${id}`) as HTMLElement)?.dataset.type, value: Number((document.getElementById(`code-${id}`) as HTMLElement)?.dataset.value), minSubtotal: Number((document.getElementById(`code-${id}`) as HTMLElement)?.dataset.min), active: !active, note: "", expiresAt: "" }),
        });
        window.location.reload();
      }}
    >
      {active ? "Disable" : "Enable"}
    </button>
  );
}
