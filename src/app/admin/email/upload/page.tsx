import { UploadRecipientsForm } from "@/components/email-tools";

export default function UploadRecipientsPage() {
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl">Upload recipients</h2>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">Paste email addresses separated by commas, spaces, or new lines. New addresses are stored as newsletter subscribers. Addresses already stored are skipped. Up to 200 at a time.</p>
      <UploadRecipientsForm />
    </div>
  );
}
