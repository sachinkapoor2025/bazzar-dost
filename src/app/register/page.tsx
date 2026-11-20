import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { Container } from "@/components/ui";
import { safeNextPath } from "@/lib/commerce";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const nextPath = safeNextPath((await searchParams).next);
  return (
    <Container className="py-8">
      <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Create an account with your name, email, and a password of at least 8 characters that includes a letter and a number. Mobile is optional. After the account is created you are signed in on this browser. The account is for your own orders and addresses. Store staff access is limited to the emails the shop has allowlisted.</p>
      <RegisterForm nextPath={nextPath} />
    </Container>
  );
}
