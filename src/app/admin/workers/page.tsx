import { createAdminClient } from "@/lib/supabase/admin";
import { Server, Search, Filter, Play, RefreshCw, XCircle } from "lucide-react";

export default async function AdminWorkersPage() {
  const adminClient = createAdminClient();

  const { data: jobs } = await adminClient
    .from("transcript_jobs")
    .select("*, media_assets(title)")
    .order("created_at", { ascending: false })
    .limit(20);

  const pendingJobs = jobs?.filter(j => j.status === 'pending' || j.status === 'processing')?.length || 0;
  const failedJobs = jobs?.filter(j => j.status === 'failed')?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Workers & Queues</h2>
          <p className="text-sm text-neutral-400 mt-1">Manage background processing jobs and workers</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-md text-sm text-indigo-400 hover:bg-indigo-500/20 transition-all">
            <RefreshCw className="w-4 h-4" /> Retry Failed
          </button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search jobs..." 
              className="pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Pending & Processing</div>
            <Server className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold text-amber-400">
            {pendingJobs}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Worker Status</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-emerald-400 font-medium">Online</span>
            </div>
          </div>
          <div className="text-2xl font-semibold text-white">
            3 Nodes
          </div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Failed Jobs (Dead Letter)</div>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-semibold text-white">
            {failedJobs}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="text-xs text-neutral-500 bg-neutral-900/50 uppercase tracking-wider border-b border-neutral-800/60">
            <tr>
              <th className="px-6 py-4 font-medium">Job ID</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Target Asset</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Created At</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {jobs?.map((job) => (
              <tr key={job.id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-neutral-300 font-mono text-xs">
                  {job.id?.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-white font-medium uppercase">
                  TRANSCRIPT_PROCESS
                </td>
                <td className="px-6 py-4 whitespace-nowrap truncate max-w-[200px]">
                  {(job.media_assets as any)?.title || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    job.status === 'processing' || job.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                  {new Date(job.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-indigo-400 hover:text-indigo-300 transition-colors p-1" title="Retry Job">
                    <Play className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!jobs || jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">No active jobs in queue</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
