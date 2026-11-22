import Link from "next/link";
import { RecordManager } from "@/components/record-manager";
import { VendorApiPanel } from "@/components/vendor-api-panel";
import { listRecords } from "@/lib/admin-records";

const tabs = [
  { id: "expense", label: "Vendor expense" },
  { id: "api", label: "Vendor API" },
];

export default async function VendorManagementPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab === "api" ? "api" : "expense";
  const [vendors, expenses] = await Promise.all([listRecords("vendor"), listRecords("vendor-expense")]);
  return (
    <div>
      <h1 className="font-display text-4xl">Vendor Management</h1>
      <nav className="mt-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link key={item.id} href={`/admin/vendor-management?tab=${item.id}`} className={tab === item.id ? "rounded-full bg-forest-800 px-3 py-1.5 text-sm font-semibold text-cream-50" : "rounded-full border border-cream-300 bg-white px-3 py-1.5 text-sm font-semibold"}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 grid gap-8">
        {tab === "expense" ? (
          <>
            <section>
              <h2 className="mb-3 font-display text-2xl">Vendors</h2>
              <RecordManager
                kind="vendor"
                noun="vendor"
                statuses={["active", "paused"]}
                rows={vendors.map(toRow)}
                fields={[
                  { name: "phone", label: "Phone" },
                  { name: "city", label: "City" },
                  { name: "notes", label: "Notes", type: "textarea" },
                ]}
              />
            </section>
            <section>
              <h2 className="mb-3 font-display text-2xl">Vendor expenses</h2>
              <RecordManager
                kind="vendor-expense"
                noun="vendor expense"
                statuses={["recorded", "void"]}
                rows={expenses.map(toRow)}
                fields={[
                  { name: "vendorName", label: "Vendor", required: true },
                  { name: "amount", label: "Amount (₹)", type: "number", required: true },
                  { name: "spentOn", label: "Date", type: "date", required: true },
                  { name: "note", label: "Note" },
                ]}
              />
            </section>
          </>
        ) : <VendorApiPanel />}
      </div>
    </div>
  );
}

function toRow(record: { id: string; title: string; status: string; createdAt: string; payload: Record<string, unknown> }) {
  const payload: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(record.payload)) {
    if (typeof value === "string" || typeof value === "number") payload[key] = value;
  }
  return { id: record.id, title: record.title, status: record.status, createdAt: record.createdAt, payload };
}
