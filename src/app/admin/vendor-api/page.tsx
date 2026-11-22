import { redirect } from "next/navigation";

export default function VendorApiRedirect() {
  redirect("/admin/vendor-management?tab=api");
}
