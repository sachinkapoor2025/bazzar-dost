import { redirect } from "next/navigation";

export default function WelcomeLeadsRedirect() {
  redirect("/admin/boost-sales?tab=welcome-leads");
}
