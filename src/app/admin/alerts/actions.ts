"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function resolveAlertAdmin(jobId: string) {
  const supabase = createAdminClient();
  
  // To resolve an alert, we'll mark the job as 'cancelled' so it disappears from the failed list.
  // Alternatively, we just append [RESOLVED] to the error message. We'll do both to be safe.
  const { data: job } = await supabase.from("transcript_jobs").select("error_message").eq("id", jobId).single();
  
  const { error } = await supabase
    .from("transcript_jobs")
    .update({ 
      status: "cancelled", 
      error_message: `[ĐÃ GIẢI QUYẾT] ${job?.error_message || ""}` 
    })
    .eq("id", jobId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/alerts");
  return { success: true };
}
