import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetail, toOrderView } from "@/components/order-detail";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) notFound();
  const owns = Boolean(user && order.userId === user.id);
  if (!owns && token !== order.accessToken) notFound();
  return (
    <Container className="py-6">
      <OrderDetail order={toOrderView(order)} confirmation />
    </Container>
  );
}
