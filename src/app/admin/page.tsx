import { createAdminClient } from "@/lib/supabase/admin";
import { Users, Clapperboard, FileText, AlertCircle, Zap, TrendingUp, Activity, LayoutDashboard, Database } from "lucide-react";
import RetryJobButton from "./RetryJobButton";
import RetryPlaylistButton from "./RetryPlaylistButton";

export const revalidate = 0; // Disable cache for admin

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();

  // Fetch counts
  const { count: usersCount } = await supabase
    .from("users") // If we use a profiles table, it's public.users. If it's auth.users, we use auth.admin.listUsers()
    .select("*", { count: "exact", head: true });

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const totalUsers = authUsers.length;
  const proUsers = authUsers.filter(u => u.user_metadata?.plan === 'pro').length;

  const { count: mediaCount } = await supabase
    .from("media_assets")
    .select("*", { count: "exact", head: true });

  const { count: vocabCount } = await supabase
    .from("vocabulary_items")
    .select("*", { count: "exact", head: true });

  const { count: totalJobsCount } = await supabase
    .from("transcript_jobs")
    .select("*", { count: "exact", head: true });
    
  const { count: failedJobsCount } = await supabase
    .from("transcript_jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed");

  // Fetch recent activity
  const { data: recentJobs } = await supabase
    .from("transcript_jobs")
    .select("*, media_assets(*)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Group stuck jobs by playlist
  const { data: stuckJobsRaw } = await supabase
    .from("transcript_jobs")
    .select("id, status, media_assets(playlist_id)")
    .in("status", ["failed", "queued", "processing", "extracting_audio", "transcribing", "analyzing"]);

  const { data: allPlaylists } = await supabase.from("playlists").select("id, title");
  const playlistMap = new Map(allPlaylists?.map((p: any) => [p.id, p.title]) || []);

  const stuckJobsByPlaylist: Record<string, { title: string, jobIds: string[] }> = {};
  if (stuckJobsRaw) {
    for (const job of stuckJobsRaw) {
      const playlistId = (job.media_assets as any)?.playlist_id;
      const key = playlistId || "standalone";
      const title = playlistId ? (playlistMap.get(playlistId) || "Unknown Playlist") : "Video Lẻ (Không có Playlist)";
      
      if (!stuckJobsByPlaylist[key]) {
        stuckJobsByPlaylist[key] = { title, jobIds: [] };
      }
      stuckJobsByPlaylist[key].jobIds.push(job.id);
    }
  }

  const tJobs = totalJobsCount || 0;
  const fJobs = failedJobsCount || 0;
  const successRate = tJobs > 0 ? (((tJobs - fJobs) / tJobs) * 100).toFixed(1) : "0.0";

  const stats = [
    { name: "Người dùng", value: totalUsers.toLocaleString(), icon: Users, color: "text-blue-500", glow: "shadow-blue-500/20" },
    { name: "Pro Users", value: proUsers.toLocaleString(), icon: Zap, color: "text-amber-500", glow: "shadow-amber-500/20" },
    { name: "Tỉ lệ Thành công", value: `${successRate}%`, icon: TrendingUp, color: "text-emerald-500", glow: "shadow-emerald-500/20" },
    { name: "Video Đã tạo", value: (mediaCount || 0).toLocaleString(), icon: Clapperboard, color: "text-purple-500", glow: "shadow-purple-500/20" },
    { name: "Từ vựng AI", value: (vocabCount || 0).toLocaleString(), icon: FileText, color: "text-indigo-500", glow: "shadow-indigo-500/20" },
    { name: "Jobs Bị Lỗi", value: fJobs.toLocaleString(), icon: Activity, color: "text-rose-500", glow: "shadow-rose-500/20" },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="flex justify-between items-center bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold">
            <LayoutDashboard className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg">Dashboard Overview</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-1">Platform metrics, revenue, and system health at a glance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-current opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" style={{ color: "var(--tw-colors-slate-500)" }} />
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-lg ${stat.glow}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="z-10">
                <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">{stat.name}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(stuckJobsByPlaylist).length > 0 && (
        <div className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Khôi Phục Tiến Trình (Theo Playlist)</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mb-5">Danh sách các playlist có video đang bị kẹt hoặc báo lỗi. Bấm "Khôi phục" để gửi lại toàn bộ webhook cho các video này.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(stuckJobsByPlaylist).map(([key, group]) => (
              <RetryPlaylistButton key={key} playlistName={group.title} jobIds={group.jobIds} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl flex-1 relative">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Processing Jobs</h2>
        </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-neutral-300">
              <thead className="bg-slate-50/80 dark:bg-white/5 text-slate-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] font-bold sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">Job ID</th>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">Media Type</th>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">Status</th>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">Time</th>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {recentJobs?.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 dark:text-neutral-500 group-hover:text-slate-500 dark:group-hover:text-neutral-400 transition-colors">{job.id.substring(0, 13)}...</td>
                    <td className="px-6 py-4">
                      <span className="capitalize px-3 py-1 bg-slate-100/50 border border-slate-200 dark:bg-white/5 dark:border-white/10 text-slate-500 dark:text-neutral-400 rounded-full font-bold text-[11px] uppercase tracking-wide">
                        {job.media_assets?.type || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {job.status === "completed" && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-500/20 dark:text-emerald-400 rounded-full font-bold text-[11px] uppercase tracking-wide flex items-center w-fit">Completed</span>}
                      {job.status === "failed" && <span className="px-3 py-1 bg-rose-50 text-rose-600 dark:bg-rose-500/10 border border-rose-500/20 dark:text-rose-400 rounded-full font-bold text-[11px] uppercase tracking-wide flex items-center w-fit">Failed</span>}
                      {["queued", "extracting_audio", "transcribing", "analyzing"].includes(job.status) && (
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 border border-indigo-500/20 dark:text-indigo-400 rounded-full font-bold text-[11px] uppercase tracking-wide flex items-center w-fit animate-pulse">Processing</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-neutral-400 font-medium text-xs">
                      {new Date(job.created_at).toLocaleString("en-GB")}
                    </td>
                    <td className="px-6 py-4 flex justify-end">
                      {job.status !== "ready" && job.status !== "completed" && (
                        <RetryJobButton jobId={job.id} />
                      )}
                    </td>
                  </tr>
                ))}
                {(!recentJobs || recentJobs.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No recent jobs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
