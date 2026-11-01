import { InquiryList } from "@/components/admin-managers";
import { api } from "@/lib/backend";

export default async function AdminInquiriesPage() {
  const all = await api<Array<{ id: string; type: string; name: string; email: string; phone: string; business: string; city: string; subject: string; message: string; productInterest: string; quantity: string; status: string; createdAt: string }>>("/admin/inquiries");
  const items = all.filter((item) => item.type !== "newsletter").slice(0, 100);
  const subscribers = all.filter((item) => item.type === "newsletter").length;
  return (
    <div>
      <h1 className="font-display text-4xl">Inquiries</h1>
      <p className="mt-2 text-sm text-muted">{subscribers} newsletter addresses are stored and are not listed with personal messages.</p>
      <div className="mt-4">
        <InquiryList items={items} />
      </div>
    </div>
  );
}
