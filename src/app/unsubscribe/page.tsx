import type { Metadata } from "next";
import { SuppressForm } from "@/components/email-suppress-form";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default function UnsubscribePage() {
  return (
    <Container className="max-w-xl py-10">
      <h1 className="font-display text-4xl">Unsubscribe</h1>
      <p className="mt-2 mb-6 text-sm leading-6 text-muted">Enter the email address that should stop receiving BazaarDost marketing messages. Order and account mail is separate from this list.</p>
      <SuppressForm />
    </Container>
  );
}
