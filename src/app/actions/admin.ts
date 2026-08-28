"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Verify admin status
async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Quick check against the ADMIN_EMAILS env variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  if (adminEmails.includes(user.email!)) return true;
  
  return false;
}

export async function createPlaylist(title: string, description: string, thumbnailUrl: string = "") {
  if (!(await checkAdmin())) throw new Error("Unauthorized");
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("playlists")
    .insert([{ title, description, thumbnail_url: thumbnailUrl }])
    .select()
    .single();
    
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/library");
  return data;
}

export async function deletePlaylist(id: string) {
  if (!(await checkAdmin())) throw new Error("Unauthorized");
  
  const supabase = createClient();
  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", id);
    
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/library");
}

export async function getPlaylists() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function createAdminMediaJob(params: {
  title: string;
  sourceUrl: string;
  targetLanguage: string;
  playlistId?: string;
}) {
  if (!(await checkAdmin())) throw new Error("Unauthorized");
  
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Create a media asset but mark it public
  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .insert([{
      user_id: user.id,
      title: params.title || "Admin Video",
      type: "youtube",
      source_url: params.sourceUrl,
      status: "pending",
      is_public: true,
      playlist_id: params.playlistId || null
    }])
    .select()
    .single();

  if (assetError) throw assetError;

  // Create a transcript job
  const { data: job, error: jobError } = await supabase
    .from("transcript_jobs")
    .insert([{
      user_id: user.id,
      media_asset_id: asset.id,
      status: "queued",
      settings: {
        targetLanguage: params.targetLanguage,
        targetVocabularyCount: 35
      }
    }])
    .select()
    .single();

  if (jobError) throw jobError;
  
  // NOTE: This usually triggers an edge function in the backend to start downloading and transcribing.
  // We assume the webhook or polling mechanism handles pending jobs.
  
  revalidatePath("/admin");
  revalidatePath("/library");
  return { asset, job };
}
