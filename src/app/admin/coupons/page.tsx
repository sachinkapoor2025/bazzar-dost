import { CouponManager } from "@/components/promo-forms";
import { CouponRow } from "@/components/coupon-row";
import { databaseConfigured, readDatabase } from "@/lib/db";
import { listLocalCoupons } from "@/lib/local-coupons";
import { listLocalOrders } from "@/lib/local-orders";

export default async function CouponsPage() {
  const [coupons, usage] = databaseConfigured()
    ? await readDatabase([[], []] as const, (client) => Promise.all([
        client.coupon.findMany({ orderBy: { code: "asc" } }),
        client.order.groupBy({
          by: ["couponCode"],
          where: { couponCode: { not: "" }, status: { not: "cancelled" } },
          _count: { _all: true },
        }),
      ]))
    : [listLocalCoupons().map((coupon) => ({ ...coupon, expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null })), [] as Array<{ couponCode: string; _count: { _all: number } }>];
  const used = databaseConfigured()
    ? new Map(usage.map((row) => [row.couponCode.toUpperCase(), row._count._all]))
    : listLocalOrders().filter((order) => order.couponCode && order.status !== "cancelled").reduce((map, order) => {
        const code = order.couponCode.toUpperCase();
        map.set(code, (map.get(code) || 0) + 1);
        return map;
      }, new Map<string, number>());
  return (
    <div>
      <h1 className="font-display text-4xl">Coupons</h1>
      <p className="mb-4 mt-2 text-sm text-muted">A coupon changes the checkout total only when it is active, not expired, and the cart meets its minimum. Usage counts orders that were not cancelled. There is no separate per-customer usage cap stored for these coupons.</p>
      <ul className="mb-6 space-y-2 text-sm">
        {coupons.map((coupon) => (
          <div key={coupon.id}>
            <CouponRow coupon={{ id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value, minSubtotal: coupon.minSubtotal, active: coupon.active, note: coupon.note, expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : "" }} />
            <p className="px-3 text-xs text-muted">Used on {used.get(coupon.code.toUpperCase()) || 0} orders{coupon.expiresAt ? ` · expires ${coupon.expiresAt.toISOString().slice(0, 10)}` : ""}</p>
          </div>
        ))}
      </ul>
      <CouponManager />
    </div>
  );
}
