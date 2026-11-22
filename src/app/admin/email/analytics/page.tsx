import { listCampaigns, subscriberEmails, suppressedEmails } from "@/lib/email-marketing";

export default async function EmailAnalyticsPage() {
  const [campaigns, subscribers, suppressed] = await Promise.all([listCampaigns(), subscriberEmails(), suppressedEmails()]);
  const sent = campaigns.reduce((sum, campaign) => sum + campaign.sent, 0);
  const failed = campaigns.reduce((sum, campaign) => sum + campaign.failed, 0);
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl">Email analytics</h2>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">Opens and clicks are not tracked. These counts are the sends stored after each campaign.</p>
      <dl className="grid gap-3 sm:grid-cols-4">
        {[
          ["Subscribers", subscribers.length],
          ["Unsubscribed", suppressed.length],
          ["Delivered", sent],
          ["Failed", failed],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-cream-300 bg-white p-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 font-display text-3xl">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
