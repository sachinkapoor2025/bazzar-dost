import { InquiryList } from "@/components/admin-managers";
import { prisma } from "@/lib/db";

export default async function AdminInquiriesPage() {
  const items = await prisma.inquiry.findMany({ where: { type: { not: "newsletter" } }, orderBy: { createdAt: "desc" }, take: 100 });
  const subscribers = await prisma.inquiry.count({ where: { type: "newsletter" } });
  return (
    <div>
      <h1 className="font-display text-4xl">Inquiries</h1>
      <p className="mt-2 text-sm text-muted">{subscribers} newsletter addresses are stored and are not listed with personal messages.</p>
      <div className="mt-4">
        <InquiryList items={items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))} />
      </div>
    </div>
  );
}
