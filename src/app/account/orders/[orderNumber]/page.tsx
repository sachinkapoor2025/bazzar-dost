import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OrderDetail, toOrderView } from "@/components/order-detail";
import { getCurrentUser } from "@/lib/auth";
import { databaseConfigured, readDatabase } from "@/lib/db";
import { datedOrder, listLocalOrders } from "@/lib/local-orders";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };

export default async function AccountOrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");
  const orderNumber = (await params).orderNumber;
  const order = databaseConfigured()
    ? await readDatabase(null, (client) => client.order.findFirst({
        where: { orderNumber, userId: user.id },
        include: { items: true },
      }))
    : (() => {
        const stored = listLocalOrders().find((item) => item.orderNumber === orderNumber && item.userId === user.id);
        return stored ? datedOrder(stored) : null;
      })();
  if (!order) notFound();
  return <OrderDetail order={toOrderView(order)} />;
}
