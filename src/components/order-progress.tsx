import { ORDER_FLOW, orderStatusLabel } from "@/lib/order-progress";

export function OrderProgress({ status }: { status: string }) {
  if (status === "cancelled") {
    return <p className="mt-4 rounded-2xl bg-[#F8E8E8] px-4 py-3 text-sm">This order is cancelled. Reserved stock has been returned when the items still exist.</p>;
  }
  const index = ORDER_FLOW.findIndex((step) => step.id === status);
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-forest-900">Status: {orderStatusLabel(status)}</p>
      <ol className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {ORDER_FLOW.map((step, stepIndex) => (
          <li key={step.id} className={`rounded-xl px-3 py-2 text-sm ${index >= 0 && stepIndex <= index ? "bg-forest-800 text-cream-50" : "bg-cream-200 text-muted"}`}>
            {step.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
