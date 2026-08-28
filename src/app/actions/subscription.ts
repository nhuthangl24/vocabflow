"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upgradePlanAction(planName: string) {
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

  // Update user_metadata via Supabase Auth Admin
  // (We use supabase.auth.updateUser to update the user's own metadata)
  const { data, error } = await supabase.auth.updateUser({
    data: { plan: normalizedPlan }
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
