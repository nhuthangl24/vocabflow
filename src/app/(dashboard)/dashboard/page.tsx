import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InlineUploadBanner from "@/components/dashboard/InlineUploadBanner";
import RecentVideosClient from "@/components/dashboard/RecentVideosClient";
import { Clock, Layers, TrendingUp, Sparkles, Video, Zap, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch recent media assets
  const { data: mediaAssets } = await supabase
    .from("media_assets")
    .select("*, transcript_jobs(status, error_message)")
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch total vocabulary items for user
  const { count: vocabCount } = await supabase
    .from("vocabulary_items")
    .select("*", { count: "exact", head: true });

  // Rough estimation of processing time/learning time (e.g. 15 mins per video)
  const estimatedMins = (mediaAssets?.length || 0) * 15;
  const learningTime = estimatedMins >= 60 ? `${(estimatedMins / 60).toFixed(1)}h` : `${estimatedMins}m`;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto mb-safe">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Hero Banner for Uploading */}
      <InlineUploadBanner userId={user.id} />

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Vercel-style Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Video className="w-4 h-4 text-slate-400" />
                <span className="text-[13px] font-bold text-slate-500">Processed Videos</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-900">{mediaAssets?.length || 0}</span>
                <span className="text-xs font-semibold text-emerald-500 mb-1">Total</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="text-[13px] font-bold text-slate-500">Vocabulary Saved</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-900">{vocabCount || 0}</span>
                <span className="text-xs font-semibold text-emerald-500 mb-1">Words</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-[13px] font-bold text-slate-500">Learning Time</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-900">{learningTime}</span>
                <span className="text-xs font-semibold text-slate-400 mb-1">Est. Lifetime</span>
              </div>
            </div>
          </div>

          {/* Videos Table/List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Activity</h2>
              <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View Library &rarr;</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <RecentVideosClient initialAssets={mediaAssets || []} />
            </div>
          </div>

        </div>

        {/* Sidebar / Right Column */}
        <div className="space-y-8">
          


          {/* AI Usage Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                AI Processing Quota
              </h3>
              <span className="text-xs font-bold text-slate-400">FREE</span>
            </div>
            
            <div className="mb-2 flex justify-between items-end">
              <span className="text-2xl font-bold text-slate-900">{mediaAssets?.length || 0}<span className="text-sm text-slate-400 ml-1">videos processed</span></span>
              <span className="text-sm font-bold text-slate-900">10 total</span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
              <div className="bg-amber-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(((mediaAssets?.length || 0) / 10) * 100, 100)}%` }}></div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link href="/pricing" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 w-full">
                Upgrade for unlimited &rarr;
              </Link>
            </div>
          </div>
          


        </div>

      </div>

    </div>
  );
}
