import { createAdminClient } from "@/lib/supabase/admin";
import UserProfileClient from "./UserProfileClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const adminClient = createAdminClient();

  const { data: user, error } = await adminClient
    .from("admin_users_view")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !user) {
    console.error("Error fetching user for profile:", error);
    notFound();
  }

  // We can fetch initial stats here to pass to Client
  // But for better UX, we'll let Client fetch data for each tab to avoid long load time for the whole page.
  // The client will use SWR or just simple fetch/useEffect for the active tab.

  return <UserProfileClient user={user} />;
}
