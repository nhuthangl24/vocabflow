"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function cancelJobAdmin(jobId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("transcript_jobs")
    .update({ 
      status: "failed", 
      error_message: "Đã bị hủy bởi Admin (Cancelled by Admin)" 
    })
    .eq("id", jobId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/tasks");
  return { success: true };
}

export async function retryJobAdmin(jobId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("transcript_jobs")
    .update({ 
      status: "pending", 
      error_message: null 
    })
    .eq("id", jobId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/tasks");
  return { success: true };
}
