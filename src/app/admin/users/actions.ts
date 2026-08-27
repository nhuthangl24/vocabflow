"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserPlan(userId: string, newPlan: "free" | "pro") {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Ensure only authorized people can do this (safety check in server action)
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
  if (!user || !user.email || !adminEmails.includes(user.email.toLowerCase())) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { plan: newPlan }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin"); // update revenue
  return { success: true };
}
