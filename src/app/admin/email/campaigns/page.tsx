import { listCampaigns } from "@/lib/email-marketing";

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();
  return (
    <div>
      <h2 className="font-display text-2xl">Campaigns</h2>
      {campaigns.length === 0 ? <p className="mt-3 text-sm text-muted">No campaign has been sent yet.</p> : (
        <ul className="mt-4 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="px-4 py-3 text-sm">
              <p className="font-semibold">{campaign.subject}</p>
              <p className="text-muted">{campaign.status} · sent {campaign.sent} · failed {campaign.failed} · {campaign.audience} · {campaign.createdAt.slice(0, 10)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
