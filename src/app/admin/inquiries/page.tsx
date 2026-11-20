import { InquiryList } from "@/components/admin-managers";
import { listInquiries } from "@/lib/inquiry-store";

export default async function AdminInquiriesPage() {
  const { messages, subscriberEmails } = await listInquiries();
  return (
    <div>
      <h1 className="font-display text-4xl">Inquiries</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Contact messages and wholesale enquiries are listed here. Newsletter addresses are stored separately and are not mixed into personal messages. Mark a message when the store has read it. Saving a message does not create an order.</p>
      <h2 className="mt-6 font-display text-2xl">Newsletter subscribers</h2>
      {subscriberEmails.length === 0 ? <p className="mt-2 text-sm text-muted">No newsletter addresses are stored yet.</p> : (
        <ul className="mt-2 max-w-xl divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white">
          {subscriberEmails.map((email) => <li key={email} className="px-4 py-2 text-sm">{email}</li>)}
        </ul>
      )}
      <div className="mt-6">
        <InquiryList items={messages} />
      </div>
    </div>
  );
}
