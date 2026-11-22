import { ShippingSettingsForm } from "@/components/shipping-settings-form";
import { loadShippingSettings } from "@/lib/shipping-settings";

export default async function ShippingPage() {
  const settings = await loadShippingSettings();
  return (
    <div>
      <h1 className="font-display text-4xl">Shipping</h1>
      <p className="mb-4 mt-2 max-w-3xl text-sm leading-6 text-muted">These settings change the checkout shipping charge and the PIN check. Empty prefix or day fields keep the server environment values. The festival dates are stored for the team. They do not change the carrier.</p>
      <ShippingSettingsForm initial={settings} />
    </div>
  );
}
