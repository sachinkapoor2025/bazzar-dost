import { RecordManager } from "@/components/record-manager";
import { listRecords } from "@/lib/admin-records";

export default async function NudgesPage() {
  const records = await listRecords("nudge");
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl">Checkout nudges</h2>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">Active nudges appear at the top of checkout. Paused nudges stay saved and are hidden from customers.</p>
      <RecordManager
        kind="nudge"
        noun="nudge"
        statuses={["active", "paused"]}
        rows={records.map((record) => ({
          id: record.id,
          title: record.title,
          status: record.status,
          createdAt: record.createdAt,
          payload: { message: String(record.payload.message || ""), href: String(record.payload.href || "") },
        }))}
        fields={[
          { name: "message", label: "Message", type: "textarea", required: true },
          { name: "href", label: "Link" },
        ]}
      />
    </div>
  );
}
