import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/profile");
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Profile</h1>
      <p className="mb-4 text-sm text-muted">Email stays {user.email}. Password changes use the reset link when email delivery is configured.</p>
      <ProfileForm name={user.name} phone={user.phone} />
    </div>
  );
}
