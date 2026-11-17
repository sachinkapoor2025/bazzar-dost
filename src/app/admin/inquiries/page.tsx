import { InquiryList } from "@/components/admin-managers";
import { listInquiries } from "@/lib/inquiry-store";

export default async function AdminInquiriesPage() {
  const { messages, subscribers } = await listInquiries();
  return (
    <div>
      <h1 className="font-display text-4xl">Inquiries</h1>
      <p className="mt-2 text-sm text-muted">{subscribers} newsletter addresses are stored and are not listed with personal messages.</p>
      <div className="mt-4">
        <InquiryList items={messages} />
      </div>
    </div>
  );
}
