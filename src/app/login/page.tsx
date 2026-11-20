import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { Container } from "@/components/ui";
import { safeNextPath } from "@/lib/commerce";

export const metadata: Metadata = { title: "Login", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const nextPath = safeNextPath((await searchParams).next);
  return (
    <Container className="py-8">
      <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Sign in with the email and password for your BazaarDost account. The session stays on this browser for up to 14 days. Orders and saved addresses for that account open after you sign in. If you do not have an account yet, create one from the register page. A forgotten password uses the reset form, and a message is sent only when outbound email is configured.</p>
      <LoginForm nextPath={nextPath} />
    </Container>
  );
}
