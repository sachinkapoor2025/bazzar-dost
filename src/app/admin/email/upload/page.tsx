import { SubscriberManager } from "@/components/subscriber-manager";
import { UploadRecipientsForm } from "@/components/email-tools";
import { listNewsletterSubscribers } from "@/lib/inquiry-store";

export default async function UploadRecipientsPage() {
  const subscribers = await listNewsletterSubscribers();
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl">Subscribers</h2>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">Paste email addresses separated by commas, spaces, or new lines. New addresses are stored as newsletter subscribers. Addresses already stored are skipped. Up to 200 at a time. You can also add, edit, or delete one address, and export the list.</p>
      <UploadRecipientsForm />
      <SubscriberManager subscribers={subscribers} />
    </div>
  );
}
