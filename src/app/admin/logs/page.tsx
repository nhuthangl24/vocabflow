import { createAdminClient } from "@/lib/supabase/admin";
import { LogsClient } from "./LogsClient";

export const revalidate = 0;

export default async function LogsPage() {
  const supabase = createAdminClient();

  // Fetch initial AI logs and user events to populate the stream
  const { data: aiLogs } = await supabase
    .from("ai_api_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: userEvents } = await supabase
    .from("user_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return <LogsClient initialAiLogs={aiLogs || []} initialUserEvents={userEvents || []} />;
}
