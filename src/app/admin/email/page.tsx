import Link from "next/link";
import { listCampaigns, subscriberEmails, suppressedEmails } from "@/lib/email-marketing";
import { mailConfigured } from "@/lib/mail";

export default async function EmailDashboardPage() {
  const [subscribers, suppressed, campaigns] = await Promise.all([subscriberEmails(), suppressedEmails(), listCampaigns()]);
  const reachable = subscribers.filter((email) => !suppressed.includes(email)).length;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <article className="rounded-2xl border border-cream-300 bg-white p-4">
        <p className="text-sm text-muted">Subscribers who can be emailed</p>
        <p className="mt-1 font-display text-4xl">{reachable}</p>
      </article>
      <article className="rounded-2xl border border-cream-300 bg-white p-4">
        <p className="text-sm text-muted">Unsubscribed</p>
        <p className="mt-1 font-display text-4xl">{suppressed.length}</p>
      </article>
      <article className="rounded-2xl border border-cream-300 bg-white p-4">
        <p className="text-sm text-muted">Email delivery</p>
        <p className="mt-1 text-lg font-semibold">{mailConfigured() ? "Ready" : "Not configured"}</p>
      </article>
      <p className="sm:col-span-3 text-sm">
        <Link href="/admin/email/compose" className="font-semibold underline">Compose a message</Link>
        {campaigns[0] ? ` · Last campaign: ${campaigns[0].subject} (${campaigns[0].status})` : " · No campaign has been sent yet."}
      </p>
    </div>
  );
}
