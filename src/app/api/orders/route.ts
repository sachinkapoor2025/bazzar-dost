import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { placeOrder } from "@/lib/place-order";
import { checkoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = checkoutSchema.parse(await request.json());
    const order = await placeOrder({
      idempotencyKey: body.idempotencyKey,
      userId: user?.id || null,
      name: body.name,
      email: body.email,
      phone: body.phone,
      notes: body.notes,
      couponCode: body.couponCode,
      address: { line1: body.line1, line2: body.line2, city: body.city, state: body.state, pincode: body.pincode },
      items: body.items.map((item) => ({ productId: item.productId, variantId: item.variantId, qty: item.qty })),
    });
    return NextResponse.json({ orderNumber: order.orderNumber, accessToken: order.accessToken });
  } catch (error) {
    return errorResponse(error);
  }
}
