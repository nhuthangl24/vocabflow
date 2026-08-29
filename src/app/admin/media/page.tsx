import { createAdminClient } from "@/lib/supabase/admin";
import AdminMediaClient from "./AdminMediaClient";

export const revalidate = 0;

export default async function AdminMediaPage() {
  const supabase = createAdminClient();

  const { data: mediaAssets } = await supabase
    .from("media_assets")
    .select(`*, transcript_jobs (status, created_at)`)
    .order("created_at", { ascending: false });

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const userMap = authUsers.reduce((acc, user) => {
    acc[user.id] = user.email || "Unknown";
    return acc;
  }, {} as Record<string, string>);

  return <AdminMediaClient initialMedia={mediaAssets || []} userMap={userMap} />;
}
