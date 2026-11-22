import { RecordManager } from "@/components/record-manager";
import { listRecords } from "@/lib/admin-records";

export default async function BannersPage() {
  const records = await listRecords("banner");
  return (
    <div>
      <h1 className="font-display text-4xl">Banners</h1>
      <p className="mb-4 mt-2 max-w-3xl text-sm leading-6 text-muted">An active banner replaces the storefront announcement bar with its title and message. Paused banners stay in this library. Upload a shop image if you want one stored with the banner.</p>
      <RecordManager
        kind="banner"
        noun="banner"
        statuses={["active", "paused"]}
        rows={records.map((record) => ({
          id: record.id,
          title: record.title,
          status: record.status,
          createdAt: record.createdAt,
          payload: {
            message: String(record.payload.message || ""),
            href: String(record.payload.href || ""),
            image: String(record.payload.image || ""),
          },
        }))}
        fields={[
          { name: "message", label: "Message", type: "textarea", required: true },
          { name: "href", label: "Link" },
          { name: "image", label: "Image", type: "image" },
        ]}
      />
    </div>
  );
}
