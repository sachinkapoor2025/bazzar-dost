import { redirect } from "next/navigation";

export default function PaymentTrackingRedirect() {
  redirect("/admin/payments");
}
