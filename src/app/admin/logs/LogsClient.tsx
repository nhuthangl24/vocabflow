"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Terminal, Filter, Play, Square, Search } from "lucide-react";
import { useRealtimeLogs } from "@/hooks/useRealtimeLogs";

export function LogsClient({ initialAiLogs = [], initialUserEvents = [] }: { initialAiLogs?: any[], initialUserEvents?: any[] }) {
  const { apiLogs: realtimeAiLogs, userEvents: realtimeUserEvents } = useRealtimeLogs();
  
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  const allLogs = useMemo(() => {
    const currentAi = realtimeAiLogs.length > 0 ? realtimeAiLogs : (initialAiLogs || []);
    const currentUser = realtimeUserEvents.length > 0 ? realtimeUserEvents : (initialUserEvents || []);

    const combinedAi = currentAi.map(l => ({ ...l, type: 'ai' }));
    const combinedUser = currentUser.map(l => ({ ...l, type: 'user' }));

    const merged = [...combinedAi, ...combinedUser].sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return merged.slice(0, 500); // keep max 500 in UI
  }, [realtimeAiLogs, realtimeUserEvents, initialAiLogs, initialUserEvents]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log: any) => {
      if (filter !== "all" && log.type !== filter) return false;
      if (search) {
        const searchStr = JSON.stringify(log).toLowerCase();
        if (!searchStr.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [allLogs, filter, search]);

  // Auto-scroll to bottom if not paused
  useEffect(() => {
    if (!isPaused) {
      endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, isPaused]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-500" />
            Luồng Log Thời gian thực
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Luồng stream trực tiếp từ AI APIs và tương tác của người dùng.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Tìm trong logs (grep)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111] border border-neutral-800 text-sm rounded-md pl-9 pr-4 py-1.5 focus:outline-none focus:border-neutral-600 text-white w-64 font-mono"
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#111] border border-neutral-800 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-600 text-neutral-300 font-mono"
          >
            <option value="all">Tất cả Logs</option>
            <option value="ai">Chỉ AI API</option>
            <option value="user">Chỉ Tương tác User</option>
          </select>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
              isPaused 
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white' 
                : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {isPaused ? "Tiếp tục" : "Tạm dừng"}
          </button>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg flex-1 overflow-hidden flex flex-col font-mono text-[11px] shadow-inner relative">
        <div className="bg-[#151515] border-b border-neutral-800 px-4 py-2 flex items-center gap-3 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
          </div>
          <span className="text-neutral-500">tail -f /var/log/system.log</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
          {filteredLogs.length === 0 && (
            <div className="text-neutral-600 italic">Đang chờ sự kiện...</div>
          )}
          
          {filteredLogs.map((log: any, i: number) => (
            <div key={log.id || i} className="hover:bg-neutral-900/50 px-2 -mx-2 py-0.5 rounded flex gap-4 break-all">
              <span className="text-neutral-600 shrink-0 select-none">
                {new Date(log.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 })}
              </span>
              
              <div className="flex-1 flex gap-2 items-start">
                {log.type === 'ai' ? (
                  <>
                    <span className="text-purple-400 font-bold shrink-0">[AI_API]</span>
                    <span className="text-blue-400 shrink-0">{log.provider}</span>
                    <span className="text-neutral-400 shrink-0">| {log.task_type} |</span>
                    <span className={log.status === 'success' ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                      {log.status === 'success' ? `SUCCESS (${log.latency_ms}ms) $${log.cost_usd}` : `ERROR: ${log.error_message}`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-400 font-bold shrink-0">[USER]</span>
                    <span className="text-neutral-500 shrink-0">{log.user_id.substring(0,8)}</span>
                    <span className="text-neutral-300">
                      {log.event_category} : <span className="text-white font-bold">{log.event_action}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={endOfLogsRef} />
        </div>

        {isPaused && (
          <div className="absolute bottom-4 right-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse flex items-center gap-2 backdrop-blur-sm">
            <Square className="w-3 h-3" /> PAUSED
          </div>
        )}
      </div>
    </div>
  );
}
