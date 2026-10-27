import { CouponManager } from "@/components/promo-forms";
import { CouponRow } from "@/components/coupon-row";
import { prisma } from "@/lib/db";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { code: "asc" } });
  return (
    <div>
      <h1 className="font-display text-4xl">Coupons</h1>
      <p className="mb-4 mt-2 text-sm text-muted">A coupon changes the checkout total only when it is active and the cart meets its rule. WELCOME50 is a starter rule you can disable.</p>
      <ul className="mb-6 space-y-2 text-sm">
        {coupons.map((coupon) => (
          <CouponRow key={coupon.id} coupon={{ id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value, minSubtotal: coupon.minSubtotal, active: coupon.active, note: coupon.note }} />
        ))}
      </ul>
      <CouponManager />
    </div>
  );
}
