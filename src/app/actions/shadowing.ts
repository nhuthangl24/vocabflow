"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveShadowingProgress(mediaAssetId: string, segmentId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase
      .from("shadowing_progress")
      .upsert({
        user_id: user.id,
        media_asset_id: mediaAssetId,
        segment_id: segmentId
      }, { onConflict: "user_id, segment_id" });

    if (error) {
      console.error("Failed to save shadowing progress:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error saving shadowing progress:", err);
    return { success: false, error: err.message };
  }
}
