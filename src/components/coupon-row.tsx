"use client";

import { formatINR } from "@/lib/format";

export function CouponRow({
  coupon,
}: {
  coupon: { id: string; code: string; type: string; value: number; minSubtotal: number; active: boolean; note: string };
}) {
  async function toggle() {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minSubtotal: coupon.minSubtotal,
        active: !coupon.active,
        note: coupon.note,
        expiresAt: "",
      }),
    });
    window.location.reload();
  }
  return (
    <li className="rounded-xl bg-white px-3 py-2">
      <strong>{coupon.code}</strong> · {coupon.type === "PERCENT" ? `${coupon.value}%` : formatINR(coupon.value)} off from {formatINR(coupon.minSubtotal)} · {coupon.active ? "Active" : "Disabled"}
      {coupon.note ? <span className="block text-muted">{coupon.note}</span> : null}
      <button type="button" className="mt-1 block text-sm font-semibold underline" onClick={toggle}>{coupon.active ? "Disable" : "Enable"}</button>
    </li>
  );
}
