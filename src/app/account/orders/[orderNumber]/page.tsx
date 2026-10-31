import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OrderDetail, toOrderView } from "@/components/order-detail";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };

export default async function AccountOrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");
  const orderNumber = (await params).orderNumber;
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { items: true },
  });
  if (!order) notFound();
  return <OrderDetail order={toOrderView(order)} />;
}
