"use server";

import { createClient } from "@/lib/supabase/server";
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

  const { error } = await supabase
    .from('plans')
    .update({
      name,
      description,
      price_usd,
      monthly_video_count,
      monthly_transcription_minutes,
      max_vocabulary_per_video,
      max_decks,
      max_upload_bytes
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  redirect("/admin/plans");
}
