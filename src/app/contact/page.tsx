import type { Metadata } from "next";
import { ContactForm } from "@/components/enquiry-forms";
import { Info } from "@/components/info";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact BazaarDost about a product, an order, or delivery. Messages are saved for the store team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Info title="Contact us" lede="Ask about a product, an order, or delivery. Messages are saved for the store team. An email notification is sent only when outbound email is configured.">
      {site.supportEmail ? <p>You can also write to {site.supportEmail}.</p> : <p>No public email address is configured yet. Use the form.</p>}
      <p>Include the product name or order number when you have one. The store reads the saved message in the admin. A copy is emailed only when outbound mail is configured, so the form itself is the record.</p>
      <p>Wholesale quantity questions belong on the wholesale form, which also stores a message and does not create an order. For a delivery already placed, use Track an order with the checkout email.</p>
      <ContactForm />
    </Info>
  );
}
