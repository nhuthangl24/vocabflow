import { createAdminClient } from "@/lib/supabase/admin";
import VouchersClient from "./VouchersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vouchers – Lumina Admin" };

export default async function AdminVouchersPage() {
  const admin = createAdminClient();

  const { data: vouchers, error } = await admin
    .from("vouchers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch vouchers error", error);
  }

  return <VouchersClient vouchers={vouchers || []} />;
}
