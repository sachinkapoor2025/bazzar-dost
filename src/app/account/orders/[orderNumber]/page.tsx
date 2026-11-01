import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OrderDetail, toOrderView } from "@/components/order-detail";
import { api } from "@/lib/backend";
import { getCurrentUser } from "@/lib/auth";
import type { OrderView } from "@/components/order-detail";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };

export default async function AccountOrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");
  const orderNumber = (await params).orderNumber;
  const order = await api<(Omit<OrderView, "createdAt"> & { createdAt: string }) | null>(`/account/orders/${encodeURIComponent(orderNumber)}`).catch(() => null);
  if (!order) notFound();
  return <OrderDetail order={toOrderView(order)} />;
}
