import { InquiryList } from "@/components/admin-managers";
import { listInquiries } from "@/lib/inquiry-store";

export default async function AdminInquiriesPage() {
  const { messages, subscribers } = await listInquiries();
  return (
    <div>
      <h1 className="font-display text-4xl">Inquiries</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Contact messages and wholesale enquiries are listed here. {subscribers} newsletter addresses are stored separately and are not mixed into personal messages. Mark a message when the store has read it. Saving a message does not create an order.</p>
      <div className="mt-4">
        <InquiryList items={messages} />
      </div>
    </div>
  );
}
