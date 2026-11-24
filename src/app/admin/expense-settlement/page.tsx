import Link from "next/link";
import { RecordManager } from "@/components/record-manager";
import { listRecords } from "@/lib/admin-records";
import { loadReconciliation } from "@/lib/admin-insights";
import { formatINR } from "@/lib/format";

const tabs = [
  { id: "expense", label: "Expense" },
  { id: "settlement", label: "Settlement" },
  { id: "reconciliation", label: "Reconciliation" },
];

export default async function ExpenseSettlementPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requested = (await searchParams).tab;
  const tab = tabs.some((item) => item.id === requested) ? requested! : "expense";
  const [expenses, settlements, reconciliation] = await Promise.all([
    listRecords("expense"),
    listRecords("settlement"),
    loadReconciliation(),
  ]);
  const settled = settlements.filter((row) => row.status === "settled").reduce((sum, row) => sum + Number(row.payload.amount || 0), 0);
  return (
    <div>
      <h1 className="font-display text-4xl">Expense & Settlement</h1>
      <nav className="mt-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link key={item.id} href={`/admin/expense-settlement?tab=${item.id}`} className={tab === item.id ? "rounded-full bg-forest-800 px-3 py-1.5 text-sm font-semibold text-cream-50" : "rounded-full border border-cream-300 bg-white px-3 py-1.5 text-sm font-semibold"}>
            {item.label}
          </Link>
        ))}
        <Link href="/admin/gst-invoices" className="rounded-full border border-cream-300 bg-white px-3 py-1.5 text-sm font-semibold">GST sales invoices</Link>
      </nav>
      <div className="mt-6">
        {tab === "expense" ? (
          <RecordManager
            kind="expense"
            noun="expense"
            statuses={["recorded", "void"]}
            rows={expenses.map(toRow)}
            fields={[
              { name: "category", label: "Category", required: true },
              { name: "amount", label: "Amount (₹)", type: "number", required: true },
              { name: "spentOn", label: "Date", type: "date", required: true },
              { name: "note", label: "Note" },
            ]}
          />
        ) : null}
        {tab === "settlement" ? (
          <RecordManager
            kind="settlement"
            noun="settlement"
            statuses={["open", "settled"]}
            rows={settlements.map(toRow)}
            fields={[
              { name: "periodStart", label: "Period start", type: "date", required: true },
              { name: "periodEnd", label: "Period end", type: "date", required: true },
              { name: "amount", label: "Amount (₹)", type: "number", required: true },
              { name: "method", label: "Method", type: "select", options: ["cash", "bank", "upi"] },
              { name: "note", label: "Note" },
            ]}
          />
        ) : null}
        {tab === "reconciliation" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Paid orders" value={`${reconciliation.paid.count} · ${formatINR(reconciliation.paid.amount)}`} href="/admin/payments?status=paid" />
            <Card label="Unpaid COD" value={`${reconciliation.unpaid.count} · ${formatINR(reconciliation.unpaid.amount)}`} href="/admin/payments?status=unpaid" />
            <Card label="Refunded" value={`${reconciliation.refunded.count} · ${formatINR(reconciliation.refunded.amount)}`} href="/admin/payments?status=refunded" />
            <Card label="Settlements marked settled" value={formatINR(settled)} href="/admin/expense-settlement?tab=settlement" />
            <p className="sm:col-span-2 text-sm text-muted">Paid means a staff member marked the cash collected. There is no card gateway balance to match. The gap between paid orders and settled amounts is {formatINR(reconciliation.paid.amount - settled)}.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Card({ label, value, href }: { label: string; value: string; href: string }) {
  return <Link href={href} className="rounded-2xl border border-cream-300 bg-white p-4 transition hover:border-forest-800"><p className="text-sm text-muted">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></Link>;
}

function toRow(record: { id: string; title: string; status: string; createdAt: string; payload: Record<string, unknown> }) {
  const payload: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(record.payload)) {
    if (typeof value === "string" || typeof value === "number") payload[key] = value;
  }
  return { id: record.id, title: record.title, status: record.status, createdAt: record.createdAt, payload };
}
