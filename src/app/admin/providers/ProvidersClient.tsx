"use client";

import { useState } from "react";
import { Cpu, Search, BrainCircuit, Activity, Zap, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRealtimeLogs } from "@/hooks/useRealtimeLogs";

function formatLatency(ms: number): string {
  if (!ms) return "0ms";
  return `${ms.toLocaleString("vi-VN")}ms`;
}

export function ProvidersClient({ initialLogs, hhtechModel, kiraModel }: { initialLogs: any[], hhtechModel?: string, kiraModel?: string }) {
  const [search, setSearch] = useState("");
  const { apiLogs } = useRealtimeLogs();
  
  // Use apiLogs if available, otherwise fallback to initialLogs
  const activeLogs = apiLogs.length > 0 ? apiLogs : initialLogs;
  
  // Helper to dynamically calculate cost if it wasn't saved in DB
  const calculateLogCost = (log: any) => {
    if (log.cost_usd && log.cost_usd > 0) return Number(log.cost_usd);
    if (!log.provider) return 0;
    const p = log.provider.toLowerCase();
    if (p === 'hhtech' || p === 'anthropic') {
      const input = log.input_tokens || log.prompt_tokens || 0;
      const output = log.output_tokens || log.completion_tokens || 0;
      return (input * 900 / 1000000) + (output * 4500 / 1000000);
    }
    return 0;
  };
  
  const isAnthropic = (p: string) => !p ? false : p.toLowerCase() === 'anthropic' || p.toLowerCase() === 'hhtech' || p === 'HHTECH_ANTHROPIC';
  const isKira = (p: string) => !p ? true : p.toLowerCase() === 'kiraai' || p.toLowerCase() === 'unknown';

  const hhtechLogs = activeLogs.filter(l => isAnthropic(l.provider));
  const kiraLogs = activeLogs.filter(l => isKira(l.provider));

  const getMetrics = (logs: any[]) => {
    if (logs.length === 0) return { latency: 0, cost: 0, tokens: 0, successRate: 100 };
    const successLogs = logs.filter(l => l.status === 'success');
    const latency = successLogs.reduce((acc, l) => acc + (l.latency_ms || 0), 0) / (successLogs.length || 1);
    const cost = logs.reduce((acc, l) => acc + calculateLogCost(l), 0);
    const successRate = (successLogs.length / logs.length) * 100;
    const tokens = logs.reduce((acc, l) => acc + (l.input_tokens || 0) + (l.output_tokens || 0), 0);
    return { latency, cost, successRate, tokens };
  };

  const hhtechMetrics = getMetrics(hhtechLogs);
  const kiraMetrics = getMetrics(kiraLogs);

  const filteredLogs = activeLogs.filter(l => 
    !search || l.provider?.toLowerCase().includes(search.toLowerCase()) || l.task_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            Nhà cung cấp AI
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Theo dõi độ trễ, token và độ tin cậy của các mô hình ngôn ngữ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HHTECH / Anthropic */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">HHTECH</h3>
                <p className="text-xs text-neutral-500">Extract & Phân tích</p>
                {hhtechModel && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-mono">
                    {hhtechModel}
                  </span>
                )}
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Bình thường
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800/50">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Độ trễ TB</p>
              <p className="text-xl font-mono text-white flex items-baseline gap-1">
                {formatLatency(Math.round(hhtechMetrics.latency))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Tỷ lệ thành công</p>
              <p className="text-xl font-mono text-white">{hhtechMetrics.successRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Tiêu thụ Token</p>
              <p className="text-xl font-mono text-white">{hhtechMetrics.tokens.toLocaleString("vi-VN")}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Chi phí ước tính</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-mono text-emerald-400">{(hhtechMetrics.cost / 1000).toFixed(4)} <span className="text-sm">VND</span></p>
                <p className="text-xs font-mono text-neutral-500">({hhtechMetrics.cost.toFixed(1)} Credit)</p>
              </div>
            </div>
          </div>
        </div>

        {/* KiraAI */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">KiraAI</h3>
                <p className="text-xs text-neutral-500">Dịch thuật & Bóng âm</p>
                {kiraModel && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
                    {kiraModel}
                  </span>
                )}
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Bình thường
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800/50">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Độ trễ TB</p>
              <p className="text-xl font-mono text-white flex items-baseline gap-1">
                {formatLatency(Math.round(kiraMetrics.latency))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Tỷ lệ thành công</p>
              <p className="text-xl font-mono text-white">{kiraMetrics.successRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Tiêu thụ Token</p>
              <p className="text-xl font-mono text-white">{kiraMetrics.tokens.toLocaleString("vi-VN")}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Chi phí ước tính</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-mono text-emerald-400">{(kiraMetrics.cost / 1000).toFixed(4)} <span className="text-sm">VND</span></p>
                <p className="text-xs font-mono text-neutral-500">({kiraMetrics.cost.toFixed(1)} Credit)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden flex flex-col max-h-[500px]">
        <div className="px-4 py-3 border-b border-neutral-800 bg-[#151515] flex justify-between items-center shrink-0">
          <h3 className="text-sm font-semibold text-white">Yêu cầu API gần đây</h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Lọc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-xs rounded pl-8 pr-3 py-1 focus:outline-none focus:border-neutral-600 text-white w-48"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-[12px] font-mono whitespace-nowrap">
            <thead className="bg-[#151515] text-neutral-500 sticky top-0 z-10 shadow-sm border-b border-neutral-800">
              <tr>
                <th className="px-4 py-2 font-medium">Thời gian</th>
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Loại Task</th>
                <th className="px-4 py-2 font-medium">Độ trễ</th>
                <th className="px-4 py-2 font-medium">Tokens</th>
                <th className="px-4 py-2 font-medium">Chi phí</th>
                <th className="px-4 py-2 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-2.5 text-neutral-500">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {isAnthropic(log.provider) ? 'HHTECH' : isKira(log.provider) ? 'KIRAAI' : log.provider}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-400">{log.task_type}</td>
                  <td className="px-4 py-2.5 text-neutral-300">{formatLatency(log.latency_ms)}</td>
                  <td className="px-4 py-2.5 text-neutral-400">
                    {((log.input_tokens || 0) + (log.output_tokens || 0)).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-emerald-400 font-bold">{(calculateLogCost(log) / 1000).toFixed(4)} VND</span>
                    <span className="text-neutral-500 text-[10px] ml-2">({calculateLogCost(log).toFixed(1)} Credit)</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {log.status === 'success' ? (
                      <span className="text-emerald-500 font-semibold">SUCCESS</span>
                    ) : (
                      <span className="text-red-500 font-semibold" title={log.error_message}>ERROR</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-600 font-sans text-sm">Không có dữ liệu.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
