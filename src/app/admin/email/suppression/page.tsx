import { suppressedEmails } from "@/lib/email-marketing";
import { SuppressForm } from "@/components/email-suppress-form";

export default async function SuppressionPage() {
  const emails = await suppressedEmails();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-2xl">Unsubscribed</h2>
        <p className="mt-2 text-sm leading-6 text-muted">These addresses are left out of later campaigns. Customers can also open the public unsubscribe page.</p>
        {emails.length === 0 ? <p className="mt-3 text-sm text-muted">No addresses are unsubscribed.</p> : (
          <ul className="mt-3 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white">
            {emails.map((email) => <li key={email} className="px-4 py-2 text-sm">{email}</li>)}
          </ul>
        )}
      </div>
      <SuppressForm />
    </div>
  );
}
