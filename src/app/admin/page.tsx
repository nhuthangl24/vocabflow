import { createAdminClient } from "@/lib/supabase/admin";
import { OverviewClient } from "./OverviewClient";

export const revalidate = 0; // Disable cache for admin

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();

  // Fetch initial stats
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const totalUsers = authUsers?.length || 0;

  return (
    <OverviewClient initialStats={{ activeUsers: totalUsers }} />
  );
}
