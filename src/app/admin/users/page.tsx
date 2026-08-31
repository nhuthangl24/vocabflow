import { createAdminClient } from "@/lib/supabase/admin";
import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const adminClient = createAdminClient();

  const page = parseInt(searchParams.page as string) || 1;
  const search = searchParams.search as string || "";
  const plan = searchParams.plan as string || "all";
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = adminClient.from("admin_users_view").select("*", { count: "exact" });

  if (search) {
    query = query.or(`email.ilike.%${search}%,id.eq.${search}`);
  }
  if (plan && plan !== "all") {
    query = query.eq("current_plan", plan.toUpperCase());
  }

  const { data: users, count, error } = await query
    .order("registered_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching users view:", error);
  }

  // Get some high level stats
  const { count: totalUsers } = await adminClient.from("admin_users_view").select("id", { count: "exact", head: true });
  const { count: proUsers } = await adminClient.from("admin_users_view").select("id", { count: "exact", head: true }).eq("current_plan", "PRO");
  const { count: basicUsers } = await adminClient.from("admin_users_view").select("id", { count: "exact", head: true }).eq("current_plan", "BASIC");

  const stats = {
    total: totalUsers || 0,
    pro: proUsers || 0,
    basic: basicUsers || 0,
  };

  return (
    <AdminUsersClient 
      users={users || []} 
      totalCount={count || 0} 
      stats={stats} 
      currentPage={page} 
      search={search}
      planFilter={plan}
    />
  );
}
