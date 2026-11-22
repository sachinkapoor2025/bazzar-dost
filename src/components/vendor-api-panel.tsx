"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { ORDER_STATUS_VALUES, orderStatusLabel } from "@/lib/order-progress";

type OrderRow = {
  id: string;
  orderNumber: string;
  name: string;
  email: string;
  status: string;
  paymentStatus: string;
  total: number;
  city: string;
  state: string;
  trackingNote: string;
};

export function VendorApiPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [nextStatus, setNextStatus] = useState("shipped");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load(event?: React.FormEvent) {
    event?.preventDefault();
    setError("");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    const response = await fetch(`/api/admin/orders?${params.toString()}`);
    const data = (await response.json()) as { orders?: OrderRow[]; error?: string };
    if (!response.ok) {
      setError(data.error || "Orders could not be loaded.");
      return;
    }
    setOrders(data.orders || []);
    setMessage(`Loaded ${data.orders?.length || 0} orders.`);
  }

  function choose(order: OrderRow) {
    setSelected(order.id);
    setNote(order.trackingNote || "");
    setNextStatus(order.status);
    setPaymentStatus(order.paymentStatus);
  }

  async function updateOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) {
      setError("Choose an order from the list first.");
      return;
    }
    if (!window.confirm("Update this order's status and tracking note?")) return;
    setError("");
    const response = await fetch(`/api/admin/orders/${selected}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, paymentStatus, trackingNote: note }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setError(data.error || "The order was not updated.");
      return;
    }
    setMessage(data.message || "Order updated.");
    await load();
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={load} className="flex flex-wrap items-end gap-2">
        <label className={labelClass}>Search orders
          <input value={query} onChange={(event) => setQuery(event.target.value)} className={fieldClass} placeholder="Order number, name, or city" />
        </label>
        <label className={labelClass}>Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={fieldClass}>
            <option value="">Any</option>
            {ORDER_STATUS_VALUES.map((item) => <option key={item} value={item}>{orderStatusLabel(item)}</option>)}
          </select>
        </label>
        <button className={buttonClass("primary")}>List orders</button>
      </form>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Order</th><th>Customer</th><th>Route</th><th>Status</th><th /></tr></thead>
          <tbody>
            {orders.length === 0 ? <tr><td className="py-3 text-muted" colSpan={5}>Run a search to load orders.</td></tr> : orders.map((order) => (
              <tr key={order.id} className="border-b border-cream-200">
                <td className="py-2 font-semibold">{order.orderNumber}</td>
                <td>{order.name}<span className="block text-xs text-muted">{order.email}</span></td>
                <td>{order.city}, {order.state}</td>
                <td className="capitalize">{orderStatusLabel(order.status)}</td>
                <td><button type="button" className="font-semibold underline" onClick={() => choose(order)}>Use</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={updateOrder} className="grid max-w-xl gap-3 rounded-2xl border border-cream-300 bg-white p-4">
        <h2 className="font-display text-2xl">Shipment update</h2>
        <p className="text-sm text-muted">This writes the order status and the tracking note customers see. Courier calls are not sent to an outside vendor.</p>
        <label className={labelClass}>Status
          <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className={fieldClass}>
            {ORDER_STATUS_VALUES.map((item) => <option key={item} value={item}>{orderStatusLabel(item)}</option>)}
          </select>
        </label>
        <label className={labelClass}>Payment
          <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className={fieldClass}>
            {["unpaid", "paid", "refunded"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className={labelClass}>Tracking note
          <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} className={fieldClass} />
        </label>
        <button className={buttonClass("primary")} disabled={!selected}>Save shipment</button>
      </form>
      {error ? <p className="text-sm text-[#7F1D1D]" role="alert">{error}</p> : null}
      {message ? <p className="text-sm" role="status">{message}</p> : null}
    </div>
  );
}
