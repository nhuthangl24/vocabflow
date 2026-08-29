"use client";

import { Activity, Server, Cpu, Users, Clock, AlertTriangle, Play, CheckCircle2, Database } from "lucide-react";
import { useRealtimeLogs } from "@/hooks/useRealtimeLogs";
import { useMemo } from "react";

export function OverviewClient({ initialStats }: { initialStats: any }) {
  const { apiLogs, userEvents } = useRealtimeLogs();

  // Calculate real metrics from the recent logs
  const aiLatency = useMemo(() => {
    const successLogs = apiLogs.filter(log => log.status === 'success' && log.latency_ms);
    if (successLogs.length === 0) return 0;
    const total = successLogs.reduce((acc, log) => acc + (Number(log.latency_ms) || 0), 0);
    return total / successLogs.length;
  }, [apiLogs]);

  const recentEvents = useMemo(() => {
    const aiEvents = apiLogs.map(log => ({ ...log, eventType: 'ai' }));
    const uEvents = userEvents.map(log => ({ ...log, eventType: 'user' }));
    return [...aiEvents, ...uEvents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5); // Take 5 most recent events
  }, [apiLogs, userEvents]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Người dùng Đăng ký" value={initialStats?.activeUsers?.toString() || "0"} icon={Users} color="text-blue-500" />
        <MetricCard title="Độ trễ AI (TB)" value={`${Math.round(aiLatency).toLocaleString("vi-VN")}ms`} icon={Activity} color={aiLatency > 3000 ? "text-red-500" : "text-emerald-500"} />
        <MetricCard title="Tổng Request AI (50s)" value={apiLogs.length.toString()} icon={Database} color="text-purple-500" />
        <MetricCard title="Tương tác User (50s)" value={userEvents.length.toString()} icon={Cpu} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111] border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center bg-[#151515]">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-neutral-400" /> Trạng thái Hệ thống (Thực)
            </h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 flex flex-col justify-center items-center text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
              <h3 className="text-sm font-medium text-white mb-1">Cơ sở dữ liệu ổn định</h3>
              <p className="text-xs text-neutral-500">Tất cả các kết nối tới Supabase đang hoạt động bình thường.</p>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 flex flex-col justify-center items-center text-center py-8">
              <Activity className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="text-sm font-medium text-white mb-1">AI API Sẵn sàng</h3>
              <p className="text-xs text-neutral-500">Node KiraAI và LLM Providers đang trong trạng thái sẵn sàng xử lý yêu cầu.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[300px]">
          <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center bg-[#151515]">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-neutral-400" /> Sự kiện gần đây
            </h2>
            <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded text-white border border-neutral-700">Live</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {recentEvents.length === 0 ? (
              <div className="text-xs text-neutral-500 italic text-center py-8">Chưa có sự kiện nào gần đây.</div>
            ) : (
              recentEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="flex gap-3 items-start">
                  {evt.eventType === 'user' ? (
                    <Users className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  ) : evt.status === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  
                  <div>
                    {evt.eventType === 'user' ? (
                      <>
                        <p className="text-sm font-medium text-neutral-300">User <span className="font-mono text-neutral-500">{evt.user_id?.substring(0,8) || 'Anon'}</span></p>
                        <p className="text-xs text-neutral-500 mt-0.5">{evt.event_category}: {evt.event_action}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-neutral-300">AI Job ({evt.provider})</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {evt.task_type} - {evt.status === 'success' ? `${evt.latency_ms}ms` : 'LỖI'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) {
  return (
    <div className="bg-[#111] border border-neutral-800 rounded-xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">{title}</p>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <h3 className="text-3xl font-mono text-white font-bold tracking-tight">{value}</h3>
    </div>
  );
}
