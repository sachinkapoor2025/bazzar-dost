import Link from "next/link";
import { listCampaigns, subscriberEmails, suppressedEmails } from "@/lib/email-marketing";
import { mailConfigured } from "@/lib/mail";

export default async function EmailDashboardPage() {
  const [subscribers, suppressed, campaigns, ready] = await Promise.all([subscriberEmails(), suppressedEmails(), listCampaigns(), mailConfigured()]);
  const reachable = subscribers.filter((email) => !suppressed.includes(email)).length;
  const sent = campaigns.reduce((sum, campaign) => sum + campaign.sent, 0);
  const failed = campaigns.reduce((sum, campaign) => sum + campaign.failed, 0);
  const pending = campaigns.reduce((sum, campaign) => sum + campaign.skipped, 0);
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
        <p className="mt-1 text-lg font-semibold">{ready ? "Ready" : "Not configured"}</p>
      </article>
      <article className="rounded-2xl border border-cream-300 bg-white p-4">
        <p className="text-sm text-muted">Sent</p>
        <p className="mt-1 font-display text-4xl">{sent}</p>
      </article>
      <article className="rounded-2xl border border-cream-300 bg-white p-4">
        <p className="text-sm text-muted">Failed</p>
        <p className="mt-1 font-display text-4xl">{failed}</p>
      </article>
      <article className="rounded-2xl border border-cream-300 bg-white p-4">
        <p className="text-sm text-muted">Pending over the 40-address cap</p>
        <p className="mt-1 font-display text-4xl">{pending}</p>
      </article>
      <p className="sm:col-span-3 text-sm">
        <Link href="/admin/email/compose" className="font-semibold underline">Compose a message</Link>
        {" · "}
        <Link href="/admin/email/upload" className="font-semibold underline">Manage subscribers</Link>
        {campaigns[0] ? ` · Last campaign: ${campaigns[0].subject} (${campaigns[0].status})` : " · No campaign has been sent yet."}
      </p>
    </div>
  );
}
