"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity, Users, Globe, Laptop, Server, PlayCircle, Clock, Zap } from "lucide-react";

export default function AdminRealtimePage() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [activeAI, setActiveAI] = useState<any[]>([]);
  
  const supabase = createClient();

  // Load initial data
  useEffect(() => {
    const loadActiveTasks = async () => {
      // Get currently processing background jobs
      const { data: jobs } = await supabase
        .from('transcript_jobs')
        .select('*, media_assets(title), auth.users(email)')
        .in('status', ['processing', 'pending'])
        .order('created_at', { ascending: false })
        .limit(10);
      if (jobs) setActiveJobs(jobs);

      // Get recent AI calls (last 5 mins)
      const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
      const { data: ai } = await supabase
        .from('ai_api_logs')
        .select('*, auth.users(email)')
        .gte('created_at', fiveMinsAgo)
        .order('created_at', { ascending: false })
        .limit(10);
      if (ai) setActiveAI(ai);
    };
    loadActiveTasks();
  }, [supabase]);

  // Realtime Subscriptions
  useEffect(() => {
    // 1. Presence (Who is online)
    const channel = supabase.channel('global_presence');
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .subscribe();

    const jobsChannel = supabase.channel('jobs_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transcript_jobs' }, (payload) => {
        // This is a naive update; in production we'd merge the payload
        setActiveJobs(prev => [payload.new, ...prev.filter(j => j.id !== (payload.new as any).id)].slice(0,10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(jobsChannel);
    };
  }, [supabase]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Realtime Telemetry 
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Live monitoring of user sessions, compute nodes, and active processes</p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-[#0a0a0a] shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Live Users</div>
            <Users className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <div className="text-3xl font-semibold text-white">
            {onlineUsers.length}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-[#0a0a0a] shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Processing Jobs</div>
            <Server className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-semibold text-white">
            {activeJobs.filter(j => j.status === 'processing').length}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-[#0a0a0a] shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">AI Tokens/min (Est)</div>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-semibold text-white">
            {activeAI.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL: ONLINE USERS */}
        <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40 flex flex-col h-[500px]">
          <div className="px-5 py-3 border-b border-neutral-800/60 bg-neutral-900/30 flex justify-between items-center">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500"/> Active User Sessions
            </h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="text-xs text-neutral-500 bg-neutral-900/20 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Location / Route</th>
                  <th className="px-5 py-3 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {onlineUsers.map((u: any, idx) => (
                  <tr key={idx} className="hover:bg-neutral-900/30 transition-colors animate-in fade-in slide-in-from-bottom-2">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="text-white font-medium">{u.email || 'Anonymous'}</div>
                      <div className="text-xs font-mono text-neutral-500">{u.user_id?.slice(0,8)}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300 font-mono">
                        {u.current_path || '/'}
                      </span>
                      {u.current_path?.includes('shadowing') && <span className="ml-2 text-xs text-indigo-400">Shadowing...</span>}
                      {u.current_path?.includes('flashcards') && <span className="ml-2 text-xs text-amber-400">Reviewing...</span>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right text-xs text-neutral-500">
                      {Math.floor((Date.now() - new Date(u.online_at).getTime()) / 60000)}m ago
                    </td>
                  </tr>
                ))}
                {onlineUsers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-neutral-500">No active users.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL: WORKERS & AI */}
        <div className="space-y-6 flex flex-col h-[500px]">
          {/* Active Jobs */}
          <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40 flex-1 flex flex-col">
            <div className="px-5 py-3 border-b border-neutral-800/60 bg-neutral-900/30 flex justify-between items-center">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-indigo-500"/> Background Processing (Queues)
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {activeJobs.map((job: any) => (
                <div key={job.id} className="p-3 rounded-lg border border-neutral-800/60 bg-neutral-900/20 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium">Transcription: {job.media_assets?.title?.slice(0, 30) || job.id.slice(0,8)}...</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">Worker assigned: {job.provider || 'default-node-01'}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      {job.status}
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {Math.floor((Date.now() - new Date(job.created_at).getTime())/1000)}s</span>
                  </div>
                </div>
              ))}
              {activeJobs.length === 0 && <div className="text-center py-8 text-neutral-500 text-sm">Queue is empty</div>}
            </div>
          </div>

          {/* Active AI Streams */}
          <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40 flex-1 flex flex-col">
            <div className="px-5 py-3 border-b border-neutral-800/60 bg-neutral-900/30 flex justify-between items-center">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500"/> Live AI Inferences
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {activeAI.map((log: any) => (
                <div key={log.id} className="p-3 rounded-lg border border-neutral-800/60 bg-neutral-900/20 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px] text-neutral-400 uppercase font-mono">{log.provider}</span>
                      {log.task_type}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">User: {log.auth?.users?.email || log.user_id?.slice(0,8)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium ${log.status==='success'?'text-emerald-400':'text-red-400'}`}>
                      {log.status === 'success' ? `${log.duration_ms}ms` : 'FAILED'}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">{log.total_tokens || 0} tkns</div>
                  </div>
                </div>
              ))}
              {activeAI.length === 0 && <div className="text-center py-8 text-neutral-500 text-sm">No recent AI activity</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
