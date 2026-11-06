import Link from "next/link";
import { OrderProgress } from "@/components/order-progress";
import { formatDate, formatINR } from "@/lib/format";

export type OrderView = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string;
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  trackingNote: string;
  items: Array<{ id: string; name: string; sku: string; qty: number; unitPrice: number; image: string }>;
};

export function toOrderView(order: Omit<OrderView, "createdAt"> & { createdAt: Date }): OrderView {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    couponCode: order.couponCode,
    name: order.name,
    email: order.email,
    phone: order.phone,
    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    notes: order.notes,
    trackingNote: order.trackingNote,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      qty: item.qty,
      unitPrice: item.unitPrice,
      image: item.image,
    })),
  };
}

export function OrderDetail({ order, confirmation = false }: { order: OrderView; confirmation?: boolean }) {
  return (
    <article>
      <h1 className="font-display text-4xl">{confirmation ? "Order placed" : "Order"} {order.orderNumber}</h1>
      {confirmation ? <p className="mt-2 text-sm leading-6">The order is recorded and stock has been reserved. Payment status is {order.paymentStatus}. Cash on delivery is collected later and is not marked paid by this page.</p> : null}
      <p className="mt-2 text-sm text-muted">Placed {formatDate(order.createdAt)} · <span className="capitalize">{order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod}</span> · <span className="capitalize">{order.paymentStatus}</span></p>
      <OrderProgress status={order.status} />
      {order.trackingNote ? <p className="mt-4 text-sm"><strong>Tracking note: </strong>{order.trackingNote}</p> : <p className="mt-4 text-sm text-muted">No courier note has been added yet.</p>}
      <ul className="mt-4 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>{item.name}<span className="block text-muted">SKU {item.sku} · Qty {item.qty}</span></span>
            <span>{formatINR(item.unitPrice * item.qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 max-w-sm space-y-1 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
        <div className="flex justify-between"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>{formatINR(order.discount)}</dd></div>
        <div className="flex justify-between"><dt>Shipping</dt><dd>{formatINR(order.shipping)}</dd></div>
        <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
      </dl>
      <address className="mt-4 text-sm not-italic leading-6">
        <strong>Deliver to</strong><br />
        {order.name}, {order.phone}<br />
        {order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />
        {order.city}, {order.state} {order.pincode}
      </address>
      {order.notes ? <p className="mt-3 text-sm">Note: {order.notes}</p> : null}
      <p className="mt-4 text-sm"><Link href="/track" className="underline">Track with order number and email</Link></p>
    </article>
  );
}
