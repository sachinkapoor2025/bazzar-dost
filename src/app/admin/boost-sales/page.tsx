import Link from "next/link";
import { CartBoard } from "@/components/cart-board";
import { InquiryList } from "@/components/admin-managers";
import { SuppressForm } from "@/components/email-suppress-form";
import { listRecords } from "@/lib/admin-records";
import { suppressedEmails } from "@/lib/email-marketing";
import { listInquiries, listInquiriesByType } from "@/lib/inquiry-store";

const tabs = [
  { id: "welcome-leads", label: "Welcome Leads" },
  { id: "carts", label: "Abandoned Carts" },
  { id: "leads", label: "Leads" },
  { id: "unsubscribe", label: "Unsubscribe Email" },
];

function tabClass(active: boolean) {
  return active ? "rounded-full bg-forest-800 px-3 py-1.5 text-sm font-semibold text-cream-50" : "rounded-full border border-cream-300 bg-white px-3 py-1.5 text-sm font-semibold text-forest-900";
}

export default async function BoostSalesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab;
  const current = tabs.some((item) => item.id === tab) ? tab! : "welcome-leads";
  return (
    <div>
      <h1 className="font-display text-4xl">Boost Sales</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Welcome leads are newsletter signups. Abandoned carts are checkout drafts that included an email. Coupons, contact leads, and unsubscribed addresses use the same records as the rest of the shop.</p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Boost sales">
        {tabs.map((item) => <Link key={item.id} href={`/admin/boost-sales?tab=${item.id}`} className={tabClass(current === item.id)}>{item.label}</Link>)}
      </nav>
      <div className="mt-6">
        {current === "welcome-leads" ? <WelcomeLeads /> : null}
        {current === "carts" ? <Carts /> : null}
        {current === "leads" ? <Leads /> : null}
        {current === "unsubscribe" ? <Unsubscribe /> : null}
      </div>
    </div>
  );
}

async function WelcomeLeads() {
  const rows = await listInquiriesByType("newsletter");
  return (
    <div>
      <p className="mb-3 text-sm text-muted">{rows.length} subscriber records.</p>
      {rows.length === 0 ? <p className="text-sm text-muted">No newsletter addresses are stored yet.</p> : (
        <ul className="divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
          {rows.map((row) => <li key={row.id} className="px-3 py-2">{row.email}<span className="block text-xs text-muted">{row.status} · {new Date(row.createdAt).toLocaleString("en-IN")}</span></li>)}
        </ul>
      )}
    </div>
  );
}

async function Carts() {
  const rows = await listRecords("cart", 200);
  return <CartBoard rows={rows.map((row) => ({ id: row.id, status: row.status, createdAt: row.createdAt, payload: row.payload as { email?: string; name?: string; phone?: string; items?: Array<{ name?: string; qty?: number }> } }))} />;
}

async function Leads() {
  const { messages } = await listInquiries();
  return <InquiryList items={messages} />;
}

async function Unsubscribe() {
  const emails = await suppressedEmails();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-2xl">Unsubscribed</h2>
        {emails.length === 0 ? <p className="mt-2 text-sm text-muted">No addresses are unsubscribed.</p> : (
          <ul className="mt-2 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
            {emails.map((email) => <li key={email} className="px-3 py-2">{email}</li>)}
          </ul>
        )}
      </div>
      <SuppressForm />
    </div>
  );
}
