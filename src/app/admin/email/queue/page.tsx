import { listCampaigns } from "@/lib/email-marketing";
import { formatDate } from "@/lib/format";

export default async function EmailQueuePage() {
  const campaigns = await listCampaigns();
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl">Queue</h2>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">Sends go out immediately, up to 40 addresses at a time. This list is the record of those sends. There is no waiting queue beyond that limit. Run compose again for the rest.</p>
      {campaigns.length === 0 ? <p className="text-sm text-muted">No campaign has been sent yet.</p> : (
        <ul className="divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="px-3 py-2">
              <span className="font-semibold">{campaign.subject}</span>
              <span className="block text-xs text-muted">{campaign.status} · sent {campaign.sent} · failed {campaign.failed} · {formatDate(campaign.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
