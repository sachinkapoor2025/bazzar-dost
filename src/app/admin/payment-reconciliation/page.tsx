import { redirect } from "next/navigation";

export default function PaymentReconciliationRedirect() {
  redirect("/admin/expense-settlement?tab=reconciliation");
}
