import { redirect } from "next/navigation";

export default function LeadsRedirect() {
  redirect("/admin/boost-sales?tab=leads");
}
