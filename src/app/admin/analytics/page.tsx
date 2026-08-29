import { createAdminClient } from "@/lib/supabase/admin";
import { Users, Activity, DollarSign, BrainCircuit, BarChart3, Clock, PlayCircle } from "lucide-react";
import AnalyticsCharts from "./AnalyticsCharts";

export const revalidate = 0;

function calculateCost(provider: string, inputTokens: number, outputTokens: number): number {
  const p = (provider || '').toLowerCase();
  if (p === 'hhtech' || p === 'anthropic' || p === 'hhtech_anthropic') {
    return (inputTokens * 900 / 1000000) + (outputTokens * 4500 / 1000000);
  }
  return 0;
}

export default async function AnalyticsPage() {
  const adminClient = createAdminClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const { data: eventsData } = await adminClient
    .from("user_events")
    .select("event_category, event_action, created_at, user_id")
    .gte('created_at', sevenDaysAgoIso);

  const { data: aiLogsData } = await adminClient
    .from("ai_api_logs")
    .select("provider, task_type, cost_usd, latency_ms, status, created_at, input_tokens, output_tokens")
    .gte('created_at', sevenDaysAgoIso);

  const events = eventsData || [];
  const aiLogs = aiLogsData || [];

  const activeUserIds = new Set(events.filter(e => e.user_id).map(e => e.user_id));
  const activeUsersCount = activeUserIds.size;
  const playEventsCount = events.filter(e => e.event_action === 'Play').length;
  const totalCost = aiLogs.reduce((acc, log) => {
    let cost = Number(log.cost_usd) || 0;
    if (cost === 0) cost = calculateCost(log.provider, log.input_tokens || 0, log.output_tokens || 0);
    return acc + cost;
  }, 0);
  const successLogs = aiLogs.filter(l => l.status === 'success').length;
  const aiSuccessRate = aiLogs.length > 0 ? ((successLogs / aiLogs.length) * 100).toFixed(1) : "100.0";

  const dailyActiveUsers: Record<string, Set<string>> = {};
  const dailyAICost: Record<string, number> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyActiveUsers[dateStr] = new Set();
    dailyAICost[dateStr] = 0;
  }

  events.forEach(e => {
    if (e.user_id) {
      const dateStr = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyActiveUsers[dateStr]) dailyActiveUsers[dateStr].add(e.user_id);
    }
  });

  aiLogs.forEach(l => {
    const dateStr = new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dailyAICost[dateStr] !== undefined) {
      let cost = Number(l.cost_usd) || 0;
      if (cost === 0) cost = calculateCost(l.provider, l.input_tokens || 0, l.output_tokens || 0);
      dailyAICost[dateStr] += cost;
    }
  });

  const chartData = Object.keys(dailyActiveUsers).map(date => ({
    date,
    activeUsers: dailyActiveUsers[date].size,
    aiCost: dailyAICost[date],
  }));

  const { data: recentErrors } = await adminClient
    .from("ai_api_logs")
    .select("provider, task_type, error_message, created_at, user_id")
    .eq('status', 'error')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          Phân tích & Tỷ lệ giữ chân
        </h1>
        <p className="text-xs text-neutral-500 mt-1">DAU, Chỉ số sử dụng, và mức độ chấp nhận nền tảng.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">User hoạt động (7d)</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-3xl font-mono text-white font-bold">{activeUsersCount}</h3>
        </div>
        
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Chi phí AI (7d)</p>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-mono text-emerald-400 font-bold">{Math.round(totalCost).toLocaleString("vi-VN")} đ</h3>
        </div>

        <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Tỷ lệ AI thành công</p>
            <BrainCircuit className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-3xl font-mono text-white font-bold">{aiSuccessRate}%</h3>
        </div>

        <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Lượt phát Video (7d)</p>
            <PlayCircle className="w-4 h-4 text-pink-500" />
          </div>
          <h3 className="text-3xl font-mono text-white font-bold">{playEventsCount}</h3>
        </div>
      </div>

      <AnalyticsCharts data={chartData} />

      <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 bg-[#151515]">
          <h3 className="text-sm font-semibold text-white">Lỗi AI gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] font-mono">
            <thead className="bg-[#151515] text-neutral-500 border-b border-neutral-800">
              <tr>
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Tác vụ</th>
                <th className="px-4 py-2 font-medium">Chi tiết lỗi</th>
                <th className="px-4 py-2 font-medium text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {recentErrors?.map((err, i) => (
                <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-2 text-neutral-300">{err.provider}</td>
                  <td className="px-4 py-2 text-neutral-400">{err.task_type}</td>
                  <td className="px-4 py-2 text-red-400 font-sans text-sm max-w-md truncate">{err.error_message || 'Lỗi không xác định'}</td>
                  <td className="px-4 py-2 text-neutral-500 text-right">{new Date(err.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {!recentErrors?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-600 font-sans">Không có lỗi nào trong 7 ngày qua.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
