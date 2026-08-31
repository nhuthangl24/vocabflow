"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleFeatureFlag(id: string, enabled: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/flags");
}

export async function createFeatureFlag({
  key,
  name,
  description,
}: {
  key: string;
  name: string;
  description?: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .insert({ key, name, description: description || null, enabled: false, rollout_percentage: 0 })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/flags");
  return data;
}

export async function deleteFeatureFlag(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("feature_flags").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/flags");
}
