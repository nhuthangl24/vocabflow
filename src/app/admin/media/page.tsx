import { createAdminClient } from "@/lib/supabase/admin";
import AdminMediaClient from "./AdminMediaClient";

export const revalidate = 0;

export default async function AdminMediaPage() {
  const adminClient = createAdminClient();

  // Fetch media assets
  const { data: media } = await adminClient
    .from("media_assets")
    .select("*, transcript_jobs(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch users for mapping
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  const userMap = users ? Object.fromEntries(users.map(u => [u.id, u.email || 'Unknown'])) : {};

  return (
    <div className="w-full">
      <AdminMediaClient initialMedia={media || []} userMap={userMap} />
    </div>
  );
}
