export const ORDER_STATUS_VALUES = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_FLOW: Array<{ id: Exclude<OrderStatus, "cancelled">; label: string }> = [
  { id: "placed", label: "Order Placed" },
  { id: "confirmed", label: "Confirmed" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
];

export function orderStatusLabel(status: string): string {
  if (status === "cancelled") return "Cancelled";
  return ORDER_FLOW.find((step) => step.id === status)?.label || status;
}
