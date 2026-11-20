import { EmailCampaignForm } from "@/components/email-campaign-form";
import { emailTemplates, savedTemplates } from "@/lib/email-marketing";

export default async function ComposeEmailPage() {
  const saved = await savedTemplates();
  const templates = [...emailTemplates(), ...saved];
  return (
    <div>
      <h2 className="mb-3 font-display text-2xl">Compose</h2>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">Each send includes the shop link and a line that points people to the unsubscribe page. Up to 40 addresses go out in one send. The rest stay for the next send.</p>
      <EmailCampaignForm templates={templates} />
    </div>
  );
}
