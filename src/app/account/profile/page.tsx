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
      <h2 className="mb-4 font-display text-3xl text-forest-900">Account details</h2>
      <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Email stays {user.email} and is the address used to sign in. You can update the name and mobile number stored on the account. Those details are filled in on later checkout forms. Password changes use the reset link when email delivery is configured.</p>
      <ProfileForm name={user.name} phone={user.phone} />
    </div>
  );
}
