import { createAdminClient } from "@/lib/supabase/admin";
import AdminUsersClient from "./AdminUsersClient";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const supabase = createAdminClient();

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return <div className="p-10 text-red-500">Error fetching users: {error.message}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <AdminUsersClient initialUsers={users} />
    </div>
  );
}
