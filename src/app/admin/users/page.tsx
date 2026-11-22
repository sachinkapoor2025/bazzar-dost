import Link from "next/link";
import { UserDeleteButton } from "@/components/user-delete-button";
import { listLocalCustomers } from "@/lib/account-store";
import { databaseConfigured, readDatabase } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const role = params.role === "admin" || params.role === "customer" ? params.role : "";
  const needle = q.toLowerCase();
  const users = databaseConfigured()
    ? await readDatabase([], (client) => client.user.findMany({
        where: {
          ...(role ? { role } : {}),
          ...(q ? { OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ] } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, _count: { select: { orders: true } } },
      }))
    : listLocalCustomers()
        .filter((user) => !role || user.role === role)
        .filter((user) => !needle || [user.name, user.email, user.phone].some((value) => value.toLowerCase().includes(needle)))
        .map((user) => ({ ...user, createdAt: user.createdAt ?? new Date(0), _count: { orders: 0 } }));
  return (
    <div>
      <h1 className="font-display text-4xl">Users</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Staff access is decided by the admin email list, not by a button on this page. Your own profile is on the account page. A customer with no orders can be deleted. Customers with orders stay on record.</p>
      <p className="mt-2 text-sm"><Link className="font-semibold underline" href="/account">Open account settings</Link></p>
      <form action="/admin/users" className="mt-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, email, or phone" className="min-h-11 w-full max-w-sm rounded-full border border-cream-300 bg-white px-4 text-sm" />
        <select name="role" defaultValue={role} className="min-h-11 rounded-full border border-cream-300 bg-white px-3 text-sm">
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Staff</option>
        </select>
        <button className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Filter</button>
      </form>
      <div className="mt-4 max-w-full overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Name</th><th>Role</th><th>Orders</th><th>Joined</th><th /></tr></thead>
          <tbody>
            {users.length === 0 ? <tr><td className="py-3 text-muted" colSpan={5}>No users match.</td></tr> : users.map((user) => (
              <tr key={user.id} className="border-b border-cream-200">
                <td className="py-2">{user.role === "customer" ? <Link className="font-semibold underline" href={`/admin/customers/${user.id}`}>{user.name}</Link> : <span className="font-semibold">{user.name}</span>}<span className="block text-xs text-muted">{user.email}</span></td>
                <td className="capitalize">{user.role}</td>
                <td>{user._count.orders}</td>
                <td>{user.createdAt ? formatDate(user.createdAt) : ""}</td>
                <td><UserDeleteButton id={user.id} disabled={!databaseConfigured() || user.role === "admin" || user._count.orders > 0} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
