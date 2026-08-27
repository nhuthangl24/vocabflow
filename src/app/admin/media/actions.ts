"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deleteMediaAssetAdmin(assetId: string) {
  const supabase = createAdminClient();

  // Deleting the media asset should cascade to transcript_jobs, segments, vocab, etc.
  // If cascading is not set up on the DB level, we should delete manually, but usually Supabase foreign keys are set to cascade.
  const { error } = await supabase.from("media_assets").delete().eq("id", assetId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/media");
  return { success: true };
}
