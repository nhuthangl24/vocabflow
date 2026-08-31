import { createAdminClient } from "@/lib/supabase/admin";
import { Activity, AlertTriangle, Server, Zap, Globe, HeartPulse, Database } from "lucide-react";
import os from "os";

export default async function AdminMonitoringPage() {
  const adminClient = createAdminClient();

  const { data: logs } = await adminClient
    .from("ai_api_logs")
    .select("duration_ms, status")
    .order("created_at", { ascending: false })
    .limit(100);

  const avgAiLatency = logs && logs.length > 0 
    ? Math.round(logs.reduce((acc, log) => acc + (log.duration_ms || 0), 0) / logs.length) 
    : 0;

  const errorRate = logs && logs.length > 0
    ? Math.round((logs.filter(l => l.status === 'error').length / logs.length) * 100)
    : 0;

  // OS Metrics (Real Data)
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);
  const cpuLoad = os.loadavg()[0]; // 1-minute load average
  
  // Real Queue Data
  const { count: pendingTasks } = await adminClient.from("tasks").select("*", { count: 'exact', head: true }).eq("status", "pending");
  const { count: processingTasks } = await adminClient.from("tasks").select("*", { count: 'exact', head: true }).eq("status", "processing");
  const { count: failedTasks } = await adminClient.from("tasks").select("*", { count: 'exact', head: true }).eq("status", "failed");

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Giám sát Hệ thống
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Chỉ số máy chủ, độ trễ và tỷ lệ lỗi (Dữ liệu thực tế)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricBox title="Độ trễ API AI (TB)" value={`${avgAiLatency}ms`} icon={Zap} color="text-indigo-400" />
        <MetricBox title="Tỷ lệ lỗi (Toàn cầu)" value={`${errorRate}%`} icon={AlertTriangle} color={errorRate > 5 ? 'text-red-400' : 'text-emerald-400'} />
        <MetricBox title="RAM Sử Dụng" value={`${memPercent}%`} icon={Server} color="text-amber-400" />
        <MetricBox title="Task Đang Xử Lý" value={`${processingTasks || 0} Tasks`} icon={Activity} color="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory & CPU */}
        <div className="border border-neutral-800/60 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30 flex justify-between items-center">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-500"/> Trạng Thái Máy Chủ (Node)
            </h3>
          </div>
          <div className="p-5 space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400">Tải CPU (1 phút)</span>
                <span className="text-white font-mono">{cpuLoad.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full ${cpuLoad > 2 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(cpuLoad * 50, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400">Bộ nhớ (RAM)</span>
                <span className="text-white font-mono">{(usedMem / 1024 / 1024 / 1024).toFixed(1)} GB / {(totalMem / 1024 / 1024 / 1024).toFixed(1)} GB</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${memPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400">Nền tảng</span>
                <span className="text-white font-mono">{os.platform()} ({os.arch()})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database & Queue */}
        <div className="border border-neutral-800/60 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30 flex justify-between items-center">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500"/> Hàng Đợi (Queue) & Database
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 rounded bg-neutral-900/50 border border-neutral-800/60">
              <div className="text-sm text-neutral-300">Task Đang Chờ (Pending)</div>
              <div className="text-white font-mono">{pendingTasks || 0}</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-neutral-900/50 border border-neutral-800/60">
              <div className="text-sm text-neutral-300">Task Bị Lỗi (Failed)</div>
              <div className={`${(failedTasks || 0) > 0 ? 'text-red-400' : 'text-emerald-400'} font-mono`}>{failedTasks || 0}</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-neutral-900/50 border border-neutral-800/60">
              <div className="text-sm text-neutral-300">Số lượng Log AI gần đây</div>
              <div className="text-white font-mono">{logs?.length || 0} / 100</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ title, value, icon: Icon, color }: any) {
  return (
    <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <div className="text-xs font-medium text-neutral-400">{title}</div>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
