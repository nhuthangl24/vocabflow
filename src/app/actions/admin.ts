"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Verify admin status
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Quick check against the ADMIN_EMAILS env variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  if (adminEmails.includes(user.email!)) return true;
  
  return false;
}

export async function createPlaylist(title: string, description: string, thumbnailUrl: string = "") {
  if (!(await checkAdmin())) throw new Error("Unauthorized");
  
  const supabase = await createClient();
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
  
  const supabase = await createClient();
  
  // Xóa tất cả các video thuộc playlist này trước
  await supabase
    .from("media_assets")
    .delete()
    .eq("playlist_id", id);

  // Xóa playlist
  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", id);
    
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/library");
}

export async function getPlaylists() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function createAdminMediaJob(params: {
  title?: string;
  sourceUrl: string;
  targetLanguage: string;
  playlistId?: string;
  module?: string;
}) {
  if (!(await checkAdmin())) throw new Error("Unauthorized");
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Auto-fetch YouTube title if not explicitly provided or if it's a generic "Video X"
  let finalTitle = params.title || "Admin Video";
  let thumbnailUrl = "";
  if (params.sourceUrl.includes('youtu')) {
    try {
      const htmlRes = await fetch(params.sourceUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } });
      const html = await htmlRes.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        finalTitle = titleMatch[1].replace(' - YouTube', '').replace('YouTube', '').trim();
      }
      // Extract video ID for thumbnail
      const match = params.sourceUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/);
      if (match && match[1]) {
        thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    } catch(e) {}
  }

  // Create a media asset but mark it public
  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .insert([{
      user_id: user.id,
      title: finalTitle,
      type: "youtube",
      source_url: params.sourceUrl,
      status: "pending",
      is_public: true,
      playlist_id: params.playlistId || null,
      module: params.module || 'vocabulary'
    }])
    .select()
    .single();

  if (assetError) throw assetError;

  // Auto-update playlist thumbnail if it doesn't have one
  if (params.playlistId && thumbnailUrl) {
    const { data: pl } = await supabase.from("playlists").select("thumbnail_url").eq("id", params.playlistId).single();
    if (pl && !pl.thumbnail_url) {
      await supabase.from("playlists").update({ thumbnail_url: thumbnailUrl }).eq("id", params.playlistId);
    }
  }

  // Create a transcript job
  const { data: job, error: jobError } = await supabase
    .from("transcript_jobs")
    .insert([{
      user_id: user.id,
      media_asset_id: asset.id,
      status: "queued",
      settings: {
        targetLanguage: params.targetLanguage,
        targetVocabularyCount: 35,
        module: params.module || 'vocabulary'
      }
    }])
    .select()
    .single();

  if (jobError) {
    console.error("Admin Job creation failed, rolling back.", jobError);
    await supabase.from("media_assets").delete().eq("id", asset.id);
    throw jobError;
  }
  
  // NOTE: This usually triggers an edge function in the backend to start downloading and transcribing.
  // We assume the webhook or polling mechanism handles pending jobs.
  
  revalidatePath("/admin");
  revalidatePath("/library");
  return { asset, job };
}
