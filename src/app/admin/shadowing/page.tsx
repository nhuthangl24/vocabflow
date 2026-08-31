import { createAdminClient } from "@/lib/supabase/admin";
import { ShadowingAdminClient } from "./ShadowingAdminClient";

export const revalidate = 0;
export const metadata = { title: "Shadowing Engine – Lumina Admin" };

export default async function AdminShadowingPage() {
  const adminClient = createAdminClient();

  const { data: jobs } = await adminClient
    .from("transcript_jobs")
    .select("id, status, provider, created_at, media_assets(title)")
    .order("created_at", { ascending: false })
    .limit(200);

  return <ShadowingAdminClient jobs={(jobs as any) ?? []} />;
}
