import { createAdminClient } from "@/lib/supabase/admin";
import { TaskMonitorClient } from "./TaskMonitorClient";

export const revalidate = 0;

export default async function TasksPage() {
  const supabase = createAdminClient();

  // Fetch recent jobs
  const { data: jobs } = await supabase
    .from("transcript_jobs")
    .select("*, media_assets(title, module)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch all users to map emails
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const userMap = new Map(authUsers?.map(u => [u.id, u]) || []);

  const jobsWithUsers = (jobs || []).map(job => {
    const user = userMap.get(job.user_id);
    return {
      ...job,
      user_email: user?.email || "Unknown",
      user_name: user?.user_metadata?.full_name || "Unknown"
    };
  });

  return <TaskMonitorClient initialJobs={jobsWithUsers} />;
}
