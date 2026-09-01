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

const FEATURE_KEYS = [
  'enable_shadowing', 'enable_vocabulary', 'enable_grammar', 'enable_flashcards',
  'enable_srs', 'enable_library', 'enable_personal_upload', 'enable_system_library',
  'enable_shadowing_upload'
];

const LIMIT_KEYS = [
  'daily_video_limit', 'max_video_duration_minutes', 'max_shadowing_minutes',
  'max_vocabulary_per_video', 'monthly_shadowing_limit', 'max_storage_bytes',
  'max_ai_calls_per_month', 'max_flashcards', 'monthly_video_count',
  'monthly_transcription_minutes', 'max_decks', 'max_upload_bytes', 'retention_days'
];

export async function createPlan(formData: FormData) {
  await verifyAdmin();
  const admin = createAdminClient();

  const payload = extractPlanPayload(formData);
  const planTablePayload = extractPlanTableColumns(payload);
  const { data: planData, error } = await admin.from("plans").insert([planTablePayload]).select().single();
  if (error) throw new Error(error.message);

  const planId = planData.id;
  await upsertFeaturesAndLimits(admin, planId, payload);

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  redirect("/admin/plans");
}

export async function updatePlan(id: string, formData: FormData) {
  await verifyAdmin();
  const admin = createAdminClient();

  const payload = extractPlanPayload(formData);
  const planTablePayload = extractPlanTableColumns(payload);
  const { error } = await admin.from("plans").update(planTablePayload).eq("id", id);
  if (error) throw new Error(error.message);

  await upsertFeaturesAndLimits(admin, id, payload);

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  redirect("/admin/plans");
}

async function upsertFeaturesAndLimits(admin: any, planId: string, payload: any) {
  const featuresToInsert = FEATURE_KEYS.map(key => ({
    plan_id: planId,
    feature_key: key,
    is_enabled: payload[key]
  }));
  
  const limitsToInsert = LIMIT_KEYS.map(key => ({
    plan_id: planId,
    limit_key: key,
    limit_value: payload[key]
  }));

  if (featuresToInsert.length > 0) {
    await admin.from('plan_features').upsert(featuresToInsert, { onConflict: 'plan_id, feature_key' });
  }
  if (limitsToInsert.length > 0) {
    await admin.from('plan_limits').upsert(limitsToInsert, { onConflict: 'plan_id, limit_key' });
  }
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

// Only the actual columns that exist in the plans table
const PLAN_TABLE_COLUMNS = [
  'name', 'description', 'price_usd', 'billing_period', 'color', 'badge_text',
  'sort_order', 'is_recommended', 'is_active', 'features_list'
];

function extractPlanTableColumns(payload: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => PLAN_TABLE_COLUMNS.includes(key))
  );
}

function extractPlanPayload(formData: FormData) {
  // Parse int, treating negative values as 0
  const safeInt = (key: string, fallback = 0) => Math.max(0, parseInt(formData.get(key) as string) || fallback);
  
  return {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    price_usd: parseFloat(formData.get("price_usd") as string) || 0,
    billing_period: formData.get("billing_period") as string || "monthly",
    color: formData.get("color") as string || "#6366f1",
    badge_text: formData.get("badge_text") as string || null,
    sort_order: safeInt("sort_order"),
    is_recommended: formData.get("is_recommended") === "on",
    is_active: formData.get("is_active") === "on",
    features_list: formData.get("features_list") as string,
    // Limits (clamped to 0 minimum)
    daily_video_limit: safeInt("daily_video_limit"),
    max_video_duration_minutes: safeInt("max_video_duration_minutes"),
    max_shadowing_minutes: safeInt("max_shadowing_minutes"),
    max_vocabulary_per_video: safeInt("max_vocabulary_per_video"),
    monthly_shadowing_limit: safeInt("monthly_shadowing_limit"),
    max_storage_bytes: safeInt("max_storage_gb") * 1024 * 1024 * 1024,
    max_ai_calls_per_month: safeInt("max_ai_calls_per_month"),
    max_flashcards: safeInt("max_flashcards"),
    // Feature toggles
    enable_shadowing: formData.get("enable_shadowing") === "on",
    enable_vocabulary: formData.get("enable_vocabulary") === "on",
    enable_grammar: formData.get("enable_grammar") === "on",
    enable_flashcards: formData.get("enable_flashcards") === "on",
    enable_srs: formData.get("enable_srs") === "on",
    enable_library: formData.get("enable_library") === "on",
    enable_personal_upload: formData.get("enable_personal_upload") === "on",
    enable_system_library: formData.get("enable_system_library") === "on",
    enable_shadowing_upload: formData.get("enable_shadowing_upload") === "on",
    // Legacy compat
    monthly_video_count: safeInt("daily_video_limit"),
    monthly_transcription_minutes: safeInt("max_video_duration_minutes"),
    max_decks: safeInt("max_decks"),
    max_upload_bytes: safeInt("max_storage_gb") * 1024 * 1024 * 1024,
    retention_days: safeInt("retention_days", 30),
  };
}
