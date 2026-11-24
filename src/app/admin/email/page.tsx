import Link from "next/link";
import { listCampaigns, subscriberEmails, suppressedEmails } from "@/lib/email-marketing";
import { mailConfigured } from "@/lib/mail";

export default async function EmailDashboardPage() {
  const [subscribers, suppressed, campaigns, ready] = await Promise.all([subscriberEmails(), suppressedEmails(), listCampaigns(), mailConfigured()]);
  const reachable = subscribers.filter((email) => !suppressed.includes(email)).length;
  const sent = campaigns.reduce((sum, campaign) => sum + campaign.sent, 0);
  const failed = campaigns.reduce((sum, campaign) => sum + campaign.failed, 0);
  const pending = campaigns.reduce((sum, campaign) => sum + campaign.skipped, 0);
  const cards = [
    ["Subscribers who can be emailed", reachable, "/admin/email/upload"],
    ["Unsubscribed", suppressed.length, "/admin/email/suppression"],
    ["Email delivery", ready ? "Ready" : "Not configured", "/admin/email/settings"],
    ["Sent", sent, "/admin/email/campaigns"],
    ["Failed", failed, "/admin/email/campaigns"],
    ["Pending over the 40-address cap", pending, "/admin/email/queue"],
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(([label, value, href]) => (
        <Link key={label} href={href} className="rounded-2xl border border-cream-300 bg-white p-4 transition hover:border-forest-800">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 font-display text-4xl">{value}</p>
        </Link>
      ))}
      <p className="sm:col-span-3 text-sm">
        <Link href="/admin/email/compose" className="font-semibold underline">Compose a message</Link>
        {" · "}
        <Link href="/admin/email/upload" className="font-semibold underline">Manage subscribers</Link>
        {campaigns[0] ? <> · Last campaign: <Link className="font-semibold underline" href="/admin/email/campaigns">{campaigns[0].subject}</Link> ({campaigns[0].status})</> : " · No campaign has been sent yet."}
      </p>
    </div>
  );
}
