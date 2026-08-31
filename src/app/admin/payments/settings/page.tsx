import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsClient } from "./SettingsClient";

export const revalidate = 0; 

export default async function AdminPaymentSettingsPage() {
  const supabase = createAdminClient();

  // Fetch all payment settings
  const { data: settings, error } = await supabase
    .from('payment_settings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching payment settings:", error);
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      <SettingsClient initialSettings={settings || []} />
    </div>
  );
}
