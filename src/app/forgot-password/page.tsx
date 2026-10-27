import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth-forms";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPage() {
  return (
    <Container className="py-8">
      <h1 className="mb-3 text-center font-display text-4xl">Forgot password</h1>
      <p className="mx-auto mb-4 max-w-md text-sm leading-6 text-muted">If outbound email is configured, a reset link is sent when the address matches an account. The reply is the same either way, so this page does not reveal whether an account exists.</p>
      <ForgotForm />
    </Container>
  );
}
