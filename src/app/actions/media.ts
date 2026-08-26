"use server";

import { createClient } from "@/lib/supabase/server";

export async function createMediaJob(data: {
  title: string;
  type: string;
  storagePath: string;
  sizeBytes: number;
  sourceUrl?: string;
  settings?: any;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let finalTitle = data.title;

  // Auto-fetch YouTube title if user didn't provide one
  if (data.type === "youtube" && data.sourceUrl && (!finalTitle || finalTitle === "YouTube Video")) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(data.sourceUrl)}&format=json`;
      const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
      if (res.ok) {
        const json = await res.json();
        if (json.title) {
          finalTitle = json.title;
        }
      }
    } catch (e) {
      console.error("Failed to fetch youtube title", e);
    }
  }

  // 1. Create media_assets
  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .insert({
      user_id: user.id,
      title: finalTitle,
      type: data.type,
      storage_path: data.storagePath,
      size_bytes: data.sizeBytes,
      source_url: data.sourceUrl,
      status: "uploaded",
    })
    .select()
    .single();

  if (assetError) throw assetError;

  // 2. Create transcript_jobs
  const { data: job, error: jobError } = await supabase
    .from("transcript_jobs")
    .insert({
      user_id: user.id,
      media_asset_id: asset.id,
      status: "queued",
      settings: data.settings || {},
    })
    .select()
    .single();

  if (jobError) throw jobError;

  // Ideally, trigger the background job processor here via webhook or just let cron pick it up.
  // For MVP, we can make an async fetch call to a route handler that starts processing in background.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${appUrl}/api/webhooks/transcription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ jobId: job.id }),
  }).catch(e => console.error("Failed to trigger job processor", e));

  return { asset, job };
}
