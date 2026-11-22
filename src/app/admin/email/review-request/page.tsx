import { ReviewRequestForm } from "@/components/email-tools";
import { emailTemplates } from "@/lib/email-marketing";

export default function ReviewRequestPage() {
  const template = emailTemplates().find((item) => item.id === "review") || emailTemplates()[0]!;
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl">Review request</h2>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">Sends one message to a customer who is not on the unsubscribe list. Delivery works only when email is configured.</p>
      <ReviewRequestForm defaults={{ subject: template.subject, message: template.message }} />
    </div>
  );
}
