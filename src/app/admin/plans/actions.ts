"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function createPlan(formData: FormData) {
  await verifyAdmin();
  const admin = createAdminClient();

  const payload = extractPlanPayload(formData);
  const { error } = await admin.from("plans").insert([payload]);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  redirect("/admin/plans");
}

export async function updatePlan(id: string, formData: FormData) {
  await verifyAdmin();
  const admin = createAdminClient();

  const payload = extractPlanPayload(formData);
  const { error } = await admin.from("plans").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  redirect("/admin/plans");
}

export async function deletePlan(id: string) {
  await verifyAdmin();
  const admin = createAdminClient();

  // Check if any active subscriptions use this plan
  const { count } = await admin
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("plan_id", id)
    .eq("status", "active");

  if ((count ?? 0) > 0) {
    throw new Error(`Không thể xóa: có ${count} user đang dùng gói này.`);
  }

  const { error } = await admin.from("plans").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
}

export async function togglePlanActive(id: string, isActive: boolean) {
  await verifyAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("plans").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
}

export async function reorderPlans(orderedIds: string[]) {
  await verifyAdmin();
  const admin = createAdminClient();

  const updates = orderedIds.map((id, index) =>
    admin.from("plans").update({ sort_order: index }).eq("id", id)
  );
  await Promise.all(updates);

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
}

function extractPlanPayload(formData: FormData) {
  return {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    price_usd: parseFloat(formData.get("price_usd") as string) || 0,
    billing_period: formData.get("billing_period") as string || "monthly",
    color: formData.get("color") as string || "#6366f1",
    badge_text: formData.get("badge_text") as string || null,
    sort_order: parseInt(formData.get("sort_order") as string) || 0,
    is_recommended: formData.get("is_recommended") === "on",
    is_active: formData.get("is_active") === "on",
    features_list: formData.get("features_list") as string,
    // Limits
    daily_video_limit: parseInt(formData.get("daily_video_limit") as string) || 0,
    max_video_duration_minutes: parseInt(formData.get("max_video_duration_minutes") as string) || 0,
    max_shadowing_minutes: parseInt(formData.get("max_shadowing_minutes") as string) || 0,
    max_vocabulary_per_video: parseInt(formData.get("max_vocabulary_per_video") as string) || 0,
    monthly_shadowing_limit: parseInt(formData.get("monthly_shadowing_limit") as string) || 0,
    max_storage_bytes: (parseInt(formData.get("max_storage_gb") as string) || 0) * 1024 * 1024 * 1024,
    max_ai_calls_per_month: parseInt(formData.get("max_ai_calls_per_month") as string) || 0,
    max_flashcards: parseInt(formData.get("max_flashcards") as string) || 0,
    // Feature toggles
    enable_shadowing: formData.get("enable_shadowing") === "on",
    enable_vocabulary: formData.get("enable_vocabulary") === "on",
    enable_grammar: formData.get("enable_grammar") === "on",
    enable_flashcards: formData.get("enable_flashcards") === "on",
    enable_srs: formData.get("enable_srs") === "on",
    enable_library: formData.get("enable_library") === "on",
    enable_personal_upload: formData.get("enable_personal_upload") === "on",
    enable_system_library: formData.get("enable_system_library") === "on",
    // Legacy compat
    monthly_video_count: parseInt(formData.get("daily_video_limit") as string) || 0,
    monthly_transcription_minutes: parseInt(formData.get("max_video_duration_minutes") as string) || 0,
    max_decks: parseInt(formData.get("max_decks") as string) || 0,
    max_upload_bytes: (parseInt(formData.get("max_storage_gb") as string) || 0) * 1024 * 1024 * 1024,
    retention_days: parseInt(formData.get("retention_days") as string) || 30,
  };
}
