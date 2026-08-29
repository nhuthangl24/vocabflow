import { createAdminClient } from "@/lib/supabase/admin";
import { AlertsClient } from "./AlertsClient";

export const revalidate = 0;

export default async function AlertsPage() {
  const supabase = createAdminClient();

  // Find recent failed jobs to generate alerts
  const { data: failedJobs } = await supabase
    .from("transcript_jobs")
    .select("id, status, error_message, created_at")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(10);

  return <AlertsClient failedJobs={failedJobs || []} />;
}
