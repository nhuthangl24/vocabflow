import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Verify admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
    if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, video_id, language, segments, playlist_id } = body;

    if (!title || !video_id || !segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Create media_asset
    const sourceUrl = `https://www.youtube.com/watch?v=${video_id}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${video_id}/hqdefault.jpg`;
    
    // Calculate duration from last segment
    let durationSeconds = 0;
    if (segments.length > 0) {
      durationSeconds = Math.ceil(segments[segments.length - 1].end);
    }

    // Check if asset already exists
    const { data: existingAsset } = await admin
      .from("media_assets")
      .select("id")
      .eq("source_url", sourceUrl)
      .single();

    let assetId;

    if (existingAsset) {
      // Update existing asset
      assetId = existingAsset.id;
      const { error: updateError } = await admin
        .from("media_assets")
        .update({
          title: title,
          duration_seconds: durationSeconds,
          thumbnail_url: thumbnailUrl,
          playlist_id: playlist_id || null,
          status: "ready"
        })
        .eq("id", assetId);
      
      if (updateError) throw new Error(`Failed to update media asset: ${updateError.message}`);

      // Delete old jobs & segments to avoid duplicates
      const { data: oldJobs } = await admin.from("transcript_jobs").select("id").eq("media_asset_id", assetId);
      if (oldJobs && oldJobs.length > 0) {
        const oldJobIds = oldJobs.map(j => j.id);
        await admin.from("transcript_segments").delete().in("job_id", oldJobIds);
        await admin.from("transcript_jobs").delete().in("id", oldJobIds);
      }
    } else {
      // Create new asset
      const { data: asset, error: assetError } = await admin
        .from("media_assets")
        .insert({
          user_id: user.id,
          title: title,
          type: "youtube",
          source_url: sourceUrl,
          thumbnail_url: thumbnailUrl,
          status: "ready",
          publish_status: "published",
          is_public: true,
          module: "shadowing",
          language: language === "auto" ? "English" : language,
          duration_seconds: durationSeconds,
          playlist_id: playlist_id || null
        })
        .select()
        .single();

      if (assetError || !asset) {
        throw new Error(`Failed to create media asset: ${assetError?.message}`);
      }
      assetId = asset.id;
    }

    // Update playlist thumbnail if needed
    if (playlist_id) {
      const { data: pl } = await admin.from("playlists").select("thumbnail_url").eq("id", playlist_id).single();
      if (pl && !pl.thumbnail_url) {
        await admin.from("playlists").update({ thumbnail_url: thumbnailUrl }).eq("id", playlist_id);
      }
    }

    // 2. Create dummy transcript_job
    const { data: job, error: jobError } = await admin
      .from("transcript_jobs")
      .insert({
        user_id: user.id,
        media_asset_id: assetId,
        status: "completed"
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to create transcript job: ${jobError?.message}`);
    }

    // 3. Create transcript_segments
    const formattedSegments = segments.map((seg: any) => ({
      job_id: job.id,
      start_time_ms: Math.round(seg.start * 1000),
      end_time_ms: Math.round(seg.end * 1000),
      text: seg.text,
      ipa: seg.pronunciation?.value || null,
      translation: seg.translation_vi || seg.translation || null,
      words: seg.words || null
    }));

    // Batch insert segments (Supabase limit is usually fine for a few hundred records, but let's do it safely)
    const { error: segmentsError } = await admin
      .from("transcript_segments")
      .insert(formattedSegments);

    if (segmentsError) {
      throw new Error(`Failed to insert segments: ${segmentsError.message}`);
    }

    return NextResponse.json({ success: true, assetId });
  } catch (error: any) {
    console.error("JSON upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to process JSON upload" }, { status: 500 });
  }
}
