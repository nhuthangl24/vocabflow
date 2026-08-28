"use server";

import { createClient } from "@/lib/supabase/server";

export async function createMediaJob(data: {
  title: string;
  type: string;
  storagePath: string;
  sizeBytes: number;
  sourceUrl?: string;
  settings?: any;
  module?: string;
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
  const userPlanName = (user.user_metadata?.plan || 'free').toUpperCase();
  const { data: planData } = await supabase.from('plans').select('daily_video_limit, max_video_duration_minutes, enable_shadowing').ilike('name', userPlanName).single();

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = user.email && adminEmails.includes(user.email);
  
  let dailyLimit = 2; // Default fallback
  let maxDurationMinutes = 25; // Default fallback
  
  if (planData) {
    dailyLimit = planData.daily_video_limit === 0 ? 999999 : planData.daily_video_limit;
    maxDurationMinutes = planData.max_video_duration_minutes === 0 ? 999999 : planData.max_video_duration_minutes;
  }
  if (isAdmin) {
    dailyLimit = 999999;
    maxDurationMinutes = 999999;
  }

  // Bỏ qua check limit nếu module là shadowing VÀ gói cước cho phép shadowing (hoặc là admin)
  const isShadowingModule = data.module === 'shadowing';
  if (isShadowingModule && !isAdmin && !planData?.enable_shadowing) {
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
