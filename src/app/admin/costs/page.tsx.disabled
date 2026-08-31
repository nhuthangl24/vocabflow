import { createAdminClient } from "@/lib/supabase/admin";
import { CostsClient } from "./CostsClient";

export const revalidate = 0;

export default async function CostsPage() {
  const supabase = createAdminClient();

  const { data: logs } = await supabase
    .from("ai_api_logs")
    .select("provider, task_type, cost_usd, input_tokens, output_tokens, created_at, user_id")
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Build user map
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const userMap: Record<string, { email: string; name: string }> = {};
  for (const u of authUsers || []) {
    userMap[u.id] = {
      email: u.email || u.id,
      name: u.user_metadata?.full_name || u.email || u.id,
    };
  }

  return <CostsClient logs={logs || []} userMap={userMap} />;
}
