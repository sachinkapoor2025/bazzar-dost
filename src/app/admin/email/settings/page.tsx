import { MailSettingsForm } from "@/components/mail-settings-form";
import { mailPublicStatus } from "@/lib/mail";

export default async function EmailSettingsPage() {
  const status = await mailPublicStatus();
  const source = status.source === "environment"
    ? "The server environment already has a mail host, so campaigns use that. The password from the environment is not shown here."
    : status.ready
      ? "Campaigns use the mail server saved below."
      : "Email is not configured yet. Add a mail server below, or set SMTP_HOST, SMTP_PORT, and SMTP_FROM on the server. Mailercloud can use MARKETING_SMTP_HOST, MARKETING_SMTP_PORT, MARKETING_SMTP_USER, MARKETING_SMTP_PASS, and MARKETING_SMTP_FROM.";
  return (
    <div className="max-w-2xl text-sm leading-6">
      <h2 className="font-display text-2xl">Settings</h2>
      <p className="mt-3">Outbound email is {status.ready ? "configured" : "not configured"}. {source}</p>
      <p className="mt-3">Messages are plain text. Opens and clicks are not tracked. A send goes out immediately, up to 40 addresses, and a failed send is reported as failed instead of sent.</p>
      <MailSettingsForm status={status} />
    </div>
  );
}
