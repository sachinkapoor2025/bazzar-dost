import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { Container } from "@/components/ui";
import { safeNextPath } from "@/lib/commerce";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const nextPath = safeNextPath((await searchParams).next);
  return (
    <Container className="py-8">
      <RegisterForm nextPath={nextPath} />
    </Container>
  );
}
