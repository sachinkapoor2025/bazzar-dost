import type { Metadata } from "next";
import { ResetForm } from "@/components/auth-forms";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token || "";
  return (
    <Container className="py-8">
      <h1 className="mb-4 text-center font-display text-4xl">Choose a new password</h1>
      {token ? <ResetForm token={token} /> : <p className="text-center text-sm">This page needs a reset link from your email.</p>}
    </Container>
  );
}
