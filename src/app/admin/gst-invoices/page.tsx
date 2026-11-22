import Link from "next/link";
import { GstSettingsForm } from "@/components/gst-settings-form";
import { loadGstInvoices } from "@/lib/admin-insights";
import { formatDate, formatINR } from "@/lib/format";
import { loadGstSettings } from "@/lib/shipping-settings";

export default async function GstInvoicesPage() {
  const [settings, invoices] = await Promise.all([loadGstSettings(), loadGstInvoices()]);
  const rate = settings.ratePercent;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">GST sales invoices</h1>
        <a className="text-sm font-semibold underline" href="/api/admin/export?type=gst">Export CSV</a>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Each invoice is a stored order that was not cancelled. The GST amount is the order total split by the rate saved below. Checkout prices are not recalculated. A zero rate means no tax split is recorded.</p>
      <div className="mt-4"><GstSettingsForm initial={settings} /></div>
      <div className="mt-6 max-w-full overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Invoice</th><th>Customer</th><th>State</th><th>Payment</th><th>Taxable</th><th>GST</th><th>Total</th></tr></thead>
          <tbody>
            {invoices.length === 0 ? <tr><td className="py-3 text-muted" colSpan={7}>No orders yet.</td></tr> : invoices.map((invoice) => {
              const gst = rate ? Math.round((invoice.total * rate) / (100 + rate)) : 0;
              return (
                <tr key={invoice.id} className="border-b border-cream-200">
                  <td className="py-2"><Link className="font-semibold underline" href={`/admin/orders/${invoice.id}`}>{invoice.orderNumber}</Link><span className="block text-xs text-muted">{formatDate(invoice.createdAt)}</span></td>
                  <td>{invoice.name}</td>
                  <td>{invoice.state}</td>
                  <td className="capitalize">{invoice.paymentStatus}</td>
                  <td>{formatINR(invoice.total - gst)}</td>
                  <td>{formatINR(gst)}</td>
                  <td>{formatINR(invoice.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
