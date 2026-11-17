import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetail, toOrderView } from "@/components/order-detail";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { databaseConfigured, prisma } from "@/lib/db";
import { datedOrder, listLocalOrders } from "@/lib/local-orders";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false, follow: false } };

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderNumber } = await params;
  const token = (await searchParams).token || "";
  const user = await getCurrentUser();
  const stored = databaseConfigured()
    ? await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } })
    : listLocalOrders().find((item) => item.orderNumber === orderNumber) ?? null;
  if (!stored) notFound();
  const order = stored.createdAt instanceof Date ? stored : datedOrder(stored);
  const owns = Boolean(user && order.userId === user.id);
  if (!owns && token !== order.accessToken) notFound();
  return (
    <Container className="py-6">
      <OrderDetail order={toOrderView(order)} confirmation />
    </Container>
  );
}
