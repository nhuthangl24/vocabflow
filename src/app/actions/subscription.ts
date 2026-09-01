"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "./admin";
import { revalidatePath } from "next/cache";

export async function upgradePlanAction(planName: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Determine the level and name based on input
  const normalizedPlan = planName.toLowerCase();
  
  if (!['free', 'basic', 'pro'].includes(normalizedPlan)) {
    return { success: false, error: "Invalid plan" };
  }

  // BẢO MẬT: Phải dùng Admin Client để update user_metadata, tránh việc hacker dùng Client key tự cấp quyền cho mình.
  const adminAuthClient = createAdminClient();
  const { data, error } = await adminAuthClient.auth.admin.updateUserById(user.id, {
    user_metadata: { plan: normalizedPlan }
  });

  if (error) {
    console.error("Error updating user plan:", error);
    return { success: false, error: error.message };
  }

  // Force revalidation of layout/pricing routes to reflect new state
  revalidatePath("/", "layout");
  revalidatePath("/pricing");
  revalidatePath("/dashboard");

  return { success: true, user: data.user };
}
