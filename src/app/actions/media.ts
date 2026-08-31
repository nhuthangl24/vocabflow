"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getUserPlanFeatures } from "@/lib/plans";

export async function createMediaJob(data: {
  title: string;
  type: string;
  storagePath: string;
  sizeBytes: number;
  sourceUrl?: string;
  settings?: any;
  module?: string;
  force?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let finalTitle = data.title;
  // Rate Limiting Logic (only for vocabulary AI extraction)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from("media_assets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())
    .neq("status", "failed")
    .neq("status", "deleted")
    .eq("module", "vocabulary");

  // Fetch user's plan dynamically
  const planFeatures = await getUserPlanFeatures(user);

  let dailyLimit = planFeatures.daily_video_limit;
  let maxDurationMinutes = planFeatures.max_video_duration_minutes;
  let maxVocab = planFeatures.max_vocabulary_per_video;

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = user.email && adminEmails.includes(user.email);

  // Enforce maxVocab limit
  if (data.settings && data.settings.targetCount && typeof data.settings.targetCount === 'number') {
    if (data.settings.targetCount > maxVocab) {
       data.settings.targetCount = maxVocab;
    }
  }

  // Bỏ qua check limit nếu module là shadowing VÀ gói cước cho phép shadowing (hoặc là admin)
  const isShadowingModule = data.module === 'shadowing';
  if (isShadowingModule && !isAdmin && !planFeatures.enable_shadowing) {
    throw new Error(`Gói cước hiện tại của bạn không hỗ trợ tính năng Phòng luyện Shadowing. Hãy nâng cấp!`);
  }

  if (!isAdmin && !isShadowingModule && todayCount !== null && todayCount >= dailyLimit) {
    throw new Error(`Bạn đã hết lượt xử lý AI hôm nay (${todayCount}/${dailyLimit}). Hãy nâng cấp gói cước để học nhiều hơn!`);
  }

  // Auto-fetch YouTube title and check length if user didn't provide one
  if (data.type === "youtube" && data.sourceUrl) {
    try {
      const htmlRes = await fetch(data.sourceUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 3600 }
      });
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        
        // Check video length
        const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/);
        if (lengthMatch && !isAdmin) {
          const lengthSeconds = parseInt(lengthMatch[1]);
          if (lengthSeconds > maxDurationMinutes * 60) {
            throw new Error(`Video này dài ${Math.ceil(lengthSeconds / 60)} phút. Gói cước của bạn chỉ hỗ trợ tối đa ${maxDurationMinutes} phút/video. Hãy nâng cấp gói cước!`);
          }
        }

        // Check title if missing
        if (!finalTitle || finalTitle === "YouTube Video") {
          const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/) || html.match(/<title>(.*?)<\/title>/);
          if (titleMatch && titleMatch[1]) {
            // decode HTML entities roughly
            finalTitle = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
          }
        }
      }
    } catch (e: any) {
      if (e.message.includes("Video") || e.message.includes("phút")) {
        throw e; // rethrow the limit error so the user sees it
      }
      console.error("Failed to fetch youtube metadata", e);
    }
  }

  // Global Deduplication (Caching)
  if (data.type === "youtube" && data.sourceUrl && !data.force) {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Extract YouTube ID for robust matching (e.g. youtu.be/123 vs youtube.com/watch?v=123)
    const videoIdMatch = data.sourceUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    let query = adminSupabase
      .from("media_assets")
      .select("*")
      .eq("module", data.module || "vocabulary")
      .eq("status", "ready");

    if (videoId) {
      query = query.ilike("source_url", `%${videoId}%`);
    } else {
      query = query.eq("source_url", data.sourceUrl);
    }

    const { data: existingAsset } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAsset) {
      if (existingAsset.user_id === user.id) {
        throw new Error("Video này đã có trong thư viện của bạn.");
      }

      // Clone the media_assets row
      const { data: newAsset, error: assetError } = await supabase
        .from("media_assets")
        .insert({
          user_id: user.id,
          title: existingAsset.title,
          type: existingAsset.type,
          storage_path: existingAsset.storage_path,
          size_bytes: existingAsset.size_bytes,
          source_url: existingAsset.source_url,
          status: "ready", // Instantly ready!
          module: existingAsset.module,
          metadata: existingAsset.metadata,
          thumbnail_url: existingAsset.thumbnail_url,
          duration_seconds: existingAsset.duration_seconds
        })
        .select()
        .single();

      if (assetError) throw assetError;

      // Clone transcript_segments
      const { data: segments } = await adminSupabase
        .from("transcript_segments")
        .select("*")
        .eq("media_asset_id", existingAsset.id);
      
      if (segments && segments.length > 0) {
        const newSegments = segments.map(s => {
          const { id, created_at, job_id, ...rest } = s;
          return { ...rest, media_asset_id: newAsset.id };
        });
        // Bulk insert segments in chunks of 500 if there are many
        for (let i = 0; i < newSegments.length; i += 500) {
          await supabase.from("transcript_segments").insert(newSegments.slice(i, i + 500));
        }
      }

      // Clone vocabulary_items
      const { data: vocab } = await adminSupabase
        .from("vocabulary_items")
        .select("*")
        .eq("media_asset_id", existingAsset.id);
      
      if (vocab && vocab.length > 0) {
        const newVocab = vocab.map(v => {
          const { id, created_at, ...rest } = v;
          return { ...rest, media_asset_id: newAsset.id };
        });
        await supabase.from("vocabulary_items").insert(newVocab);
      }

      // Clone grammar_items
      const { data: grammar } = await adminSupabase
        .from("grammar_items")
        .select("*")
        .eq("media_asset_id", existingAsset.id);
      
      if (grammar && grammar.length > 0) {
        const newGrammar = grammar.map(g => {
          const { id, created_at, ...rest } = g;
          return { ...rest, media_asset_id: newAsset.id };
        });
        await supabase.from("grammar_items").insert(newGrammar);
      }

      return { asset: newAsset, job: null, cached: true };
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
      module: data.module || "vocabulary",
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

  if (jobError) {
    // COMPENSATION TRANSACTION: Rollback media_asset creation if job creation fails
    console.error("Job creation failed, rolling back media asset creation.", jobError);
    await supabase.from("media_assets").delete().eq("id", asset.id);
    throw jobError;
  }

  // Do NOT trigger webhook here because Next.js will abort the fetch when the action returns.
  // Instead, the client component will call the webhook directly using the returned job id.

  return { asset, job };
}
