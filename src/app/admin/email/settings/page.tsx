import { mailConfigured } from "@/lib/mail";

export default function EmailSettingsPage() {
  const ready = mailConfigured();
  return (
    <div className="max-w-2xl text-sm leading-6">
      <h2 className="font-display text-2xl">Settings</h2>
      <p className="mt-3">Outbound email is {ready ? "configured" : "not configured"}. A campaign can be sent only when the host, port, and from address are set in the server environment. The password is not shown here.</p>
      <p className="mt-3">This shop sends plain text through that mail server. It does not use a separate campaign vendor, open tracking, or click tracking.</p>
    </div>
  );
}
