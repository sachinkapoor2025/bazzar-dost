import { redirect } from "next/navigation";

export default function CartsRedirect() {
  redirect("/admin/boost-sales?tab=carts");
}
