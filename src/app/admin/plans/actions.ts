"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updatePlan(id: string, formData: FormData) {
  const supabase = await createClient();
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price_usd = parseFloat(formData.get("price_usd") as string);
  const monthly_video_count = parseInt(formData.get("monthly_video_count") as string);
  const monthly_transcription_minutes = parseInt(formData.get("monthly_transcription_minutes") as string);
  const max_vocabulary_per_video = parseInt(formData.get("max_vocabulary_per_video") as string);
  const max_decks = parseInt(formData.get("max_decks") as string);
  const max_upload_bytes = parseInt(formData.get("max_upload_bytes") as string) * 1024 * 1024; // convert MB to bytes

  // New fields
  const is_recommended = formData.get("is_recommended") === "on";
  const features_list = formData.get("features_list") as string;
  const daily_video_limit = parseInt(formData.get("daily_video_limit") as string);
  const max_video_duration_minutes = parseInt(formData.get("max_video_duration_minutes") as string);
  const enable_shadowing = formData.get("enable_shadowing") === "on";

  // Use admin client to bypass RLS since 'plans' table doesn't have an UPDATE policy
  const adminSupabase = createAdminClient();
  
  const { error } = await adminSupabase
    .from('plans')
    .update({
      name,
      description,
      price_usd,
      monthly_video_count,
      monthly_transcription_minutes,
      max_vocabulary_per_video,
      max_decks,
      max_upload_bytes,
      is_recommended,
      features_list,
      daily_video_limit,
      max_video_duration_minutes,
      enable_shadowing
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  redirect("/admin/plans");
}
