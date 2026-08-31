import { createAdminClient } from "@/lib/supabase/admin";
import FeatureFlagsClient from "./FeatureFlagsClient";

export const revalidate = 0;
export const metadata = { title: "Cờ Tính Năng – Lumina Admin" };

export default async function AdminFlagsPage() {
  const supabase = createAdminClient();

  const { data: flags } = await supabase
    .from("feature_flags")
    .select("*")
    .order("enabled", { ascending: false })
    .order("name");

  return <FeatureFlagsClient flags={flags ?? []} />;
}
