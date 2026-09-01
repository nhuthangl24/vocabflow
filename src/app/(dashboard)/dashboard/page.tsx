import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InlineUploadBanner from "@/components/dashboard/InlineUploadBanner";
import RecentVideosClient from "@/components/dashboard/RecentVideosClient";
import { Clock, Layers, TrendingUp, Sparkles, Video, Zap, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getUserPlanFeatures } from "@/lib/plans";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let mediaAssets = [];
  let totalVideosCount = 0;
  let vocabCount = 0;
  let todayCount = 0;

  // Check if user is Admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = user && user.email && adminEmails.includes(user.email);

  // Fetch plan dynamically
  const planFeatures = await getUserPlanFeatures(user);
  const isPro = planFeatures.name === 'PRO' || planFeatures.name === 'LIFETIME' || isAdmin;
  const dailyLimit = planFeatures.daily_video_limit;
  const maxVocab = planFeatures.max_vocabulary_per_video;
  const canUpload = isAdmin || planFeatures.enable_personal_upload;

  if (user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run queries concurrently for better performance
    const [
      { data: ma },
      { count: mc },
      { count: vc },
      { count: tc }
    ] = await Promise.all([
      // Fetch recent vocabulary media assets
      supabase
        .from("media_assets")
        .select("*, transcript_jobs(status, error_message, settings)")
        .neq("status", "deleted")
        .eq("user_id", user.id)
        .eq("module", "vocabulary")
        .order("created_at", { ascending: false })
        .limit(4),

      // Fetch total vocabulary media assets count
      supabase
        .from("media_assets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "deleted")
        .eq("module", "vocabulary"),

      // Fetch total vocabulary items for user
      supabase
        .from("vocabulary_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Fetch today's video count
      supabase
        .from("media_assets")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString())
        .eq("user_id", user.id)
        .neq("status", "failed")
        .neq("status", "deleted")
        .eq("module", "vocabulary")
    ]);

    if (ma) mediaAssets = ma;
    totalVideosCount = mc || 0;
    vocabCount = vc || 0;
    todayCount = tc || 0;
  }

  // Rough estimation of processing time/learning time (e.g. 15 mins per video)
  const estimatedMins = (totalVideosCount || 0) * 15;
  const learningTime = estimatedMins >= 60 ? `${(estimatedMins / 60).toFixed(1)}h` : `${estimatedMins}m`;

  return (
    <div className="p-4 sm:p-5 w-full mx-auto mb-safe">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tổng quan</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-400">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Hero Banner for Uploading */}
      <InlineUploadBanner userId={user?.id || ""} isPro={!!isPro} todayCount={todayCount} dailyLimit={dailyLimit} maxVocab={maxVocab} />

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Vercel-style Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md transition-shadow dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <Video className="w-4 h-4 text-slate-400 dark:text-neutral-400" />
                <span className="text-[13px] font-bold text-slate-500 dark:text-neutral-400">Video đã xử lý</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalVideosCount}</span>
                <span className="text-xs font-semibold text-emerald-500 mb-1">Tổng</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md transition-shadow dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-slate-400 dark:text-neutral-400" />
                <span className="text-[13px] font-bold text-slate-500 dark:text-neutral-400">Từ vựng đã lưu</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{vocabCount || 0}</span>
                <span className="text-xs font-semibold text-emerald-500 mb-1">Từ</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md transition-shadow dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400 dark:text-neutral-400" />
                <span className="text-[13px] font-bold text-slate-500 dark:text-neutral-400">Thời gian học</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{learningTime}</span>
                <span className="text-xs font-semibold text-slate-400 mb-1 dark:text-neutral-400">Ước tính</span>
              </div>
            </div>
          </div>

          {/* Videos Table/List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Hoạt động gần đây</h2>
              <Link href="/library" className="text-xs font-semibold text-indigo-600 dark:text-neutral-200 hover:text-indigo-700">Xem thư viện &rarr;</Link>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden dark:border-neutral-700">
              <RecentVideosClient initialAssets={mediaAssets || []} userId={user?.id || ""} />
            </div>
          </div>

        </div>

        {/* Sidebar / Right Column */}
        <div className="space-y-8">
          
          {/* AI Usage Card */}
          {!isAdmin && (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm dark:border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Giới hạn AI trong ngày
              </h3>
              <span className={`text-xs font-bold ${isPro ? 'text-amber-500' : 'text-slate-400'}`}>
                {isPro ? 'PRO' : 'MIỄN PHÍ'}
              </span>
            </div>
            
            <div className="mb-2 flex justify-between items-end">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{todayCount}<span className="text-sm text-slate-400 ml-1 dark:text-neutral-400">video hôm nay</span></span>
              <span className="text-sm font-bold text-slate-900 dark:text-neutral-300">
                {dailyLimit === 999999 ? "Không giới hạn" : `tối đa ${dailyLimit}`}
              </span>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-neutral-900 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${todayCount >= dailyLimit ? 'bg-rose-500' : 'bg-amber-400'}`} 
                style={{ width: `${Math.min((todayCount / dailyLimit) * 100, 100)}%` }}
              ></div>
            </div>
            
            {!isPro && (
              <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 mt-4">
                <Link href="/pricing" className="text-sm font-bold text-indigo-600 dark:text-neutral-200 hover:text-indigo-700 flex items-center justify-center gap-1 w-full">
                  Nâng cấp để học nhiều hơn &rarr;
                </Link>
              </div>
            )}
          </div>
          )}


        </div>

      </div>

    </div>
  );
}
