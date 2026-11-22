import { redirect } from "next/navigation";

export default function ExpensesRedirect() {
  redirect("/admin/expense-settlement?tab=expense");
}
