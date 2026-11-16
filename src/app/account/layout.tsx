import { redirect } from "next/navigation";
import { AccountFrame } from "@/components/account-frame";
import { getCurrentUser } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  return <AccountFrame user={user}>{children}</AccountFrame>;
}
