import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Total vocab count
  const { count: vocabCount } = await supabase
    .from("vocabulary_items")
    .select("*", { count: "exact", head: true })
    .eq('user_id', user.id);

  // 2. Mastered and Total Cards count
  const { data: cardsData } = await supabase
    .from('deck_cards')
    .select('interval_days')
    .eq('user_id', user.id);
    
  const totalLearnedCards = cardsData?.length || 0;
  const masteredCards = cardsData?.filter(c => c.interval_days >= 21).length || 0;

  // 3. Shadowing Progress
  const { count: completedShadowingSegments } = await supabase
    .from("shadowing_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Approximate total shadowing segments available (public shadowing videos)
  const { data: shadowingAssets } = await supabase
    .from("media_assets")
    .select("id")
    .eq("module", "shadowing")
    .eq("status", "ready");
    
  const shadowingAssetIds = shadowingAssets?.map(a => a.id) || [];
  let totalShadowingSegments = 0;
  
  if (shadowingAssetIds.length > 0) {
    const { count: totalSegments } = await supabase
      .from("transcript_segments")
      .select("*", { count: "exact", head: true })
      .in("media_asset_id", shadowingAssetIds);
    totalShadowingSegments = totalSegments || 0;
  }

  // 4. Study logs for the last 365 days
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  const { data: logsData } = await supabase
    .from('study_logs')
    .select('card_id, created_at, rating')
    .eq('user_id', user.id)
    .gte('created_at', oneYearAgo.toISOString());

  // Date manipulation helpers (using local YYYY-MM-DD formatting to avoid timezone offset bugs)
  const getLocalDateStr = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const today = new Date();
  const todayStr = getLocalDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  // Today's performance
  const todaysLogs = logsData?.filter(l => l.created_at.startsWith(todayStr)) || [];
  const todayCorrect = todaysLogs.filter(l => l.rating !== 'again').length;
  const uniqueCardsToday = new Set(todaysLogs.map(l => l.card_id)).size;

  // Streak Calculation
  const activeDates = new Set(logsData?.map(l => l.created_at.split('T')[0]) || []);
  let currentStreak = 0;
  let maxStreak = 0;

  // Compute current streak
  if (activeDates.has(todayStr) || activeDates.has(yesterdayStr)) {
    const dateToCheck = activeDates.has(todayStr) ? new Date(today) : new Date(yesterday);
    while (true) {
      const dStr = getLocalDateStr(dateToCheck);
      if (activeDates.has(dStr)) {
        currentStreak++;
        dateToCheck.setDate(dateToCheck.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Compute max streak
  let tempStreak = 0;
  let prevDate: Date | null = null;
  const ascDates = Array.from(activeDates).sort();
  for (let i = 0; i < ascDates.length; i++) {
     const d = new Date(ascDates[i]);
     if (!prevDate) {
        tempStreak = 1;
     } else {
        const diff = (d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
        if (Math.round(diff) === 1) {
           tempStreak++;
        } else {
           tempStreak = 1;
        }
     }
     if (tempStreak > maxStreak) maxStreak = tempStreak;
     prevDate = d;
  }

  // Heatmap Data
  const heatmapMap = new Map<string, number>();
  logsData?.forEach(l => {
    const dStr = l.created_at.split('T')[0];
    heatmapMap.set(dStr, (heatmapMap.get(dStr) || 0) + 1);
  });

  const heatmapDays = Array.from({ length: 365 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (364 - i));
    const dStr = getLocalDateStr(d);
    const count = heatmapMap.get(dStr) || 0;
    
    let intensity = 0;
    if (count > 50) intensity = 4;
    else if (count > 30) intensity = 3;
    else if (count > 10) intensity = 2;
    else if (count > 0) intensity = 1;

    return { date: d.toISOString(), intensity, count };
  });

  const stats = {
    vocabCount: vocabCount || 0,
    totalLearnedCards,
    masteredCards,
    todayCorrect,
    completedToday: uniqueCardsToday,
    currentStreak,
    maxStreak,
    heatmapDays,
    completedShadowingSegments: completedShadowingSegments || 0,
    totalShadowingSegments
  };

  return <AnalyticsClient stats={stats} />;
}
