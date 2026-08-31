"use client";

import { useState, useEffect } from "react";
import { Zap, Coins, Calculator, Bot, CalendarDays, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

type AIUsageClientProps = {
  userPlan: string;
  creditsLimit: number;
};

export default function AIUsageClient({ userPlan, creditsLimit }: AIUsageClientProps) {
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/ai-usage?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        toast.error(json.error || "Failed to load usage");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [range]);

  const t = data?.totals || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, estimated_cost_usd: 0, requests: 0 };
  const history = data?.history || [];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-lg p-1">
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: 'week', label: '7 ngày' },
            { id: 'month', label: '30 ngày' },
            { id: 'all', label: 'Tất cả' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRange(r.id as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${range === r.id ? 'bg-indigo-50 text-indigo-700 dark:bg-neutral-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button 
          onClick={fetchUsage}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:bg-[#0a0a0a] dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-slate-500 dark:text-neutral-400">Total Tokens</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.total_tokens.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
            {t.prompt_tokens.toLocaleString()} in / {t.completion_tokens.toLocaleString()} out
          </p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-500 dark:text-neutral-400">AI Requests</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.requests.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
            API calls made
          </p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-slate-500 dark:text-neutral-400">Estimated Cost</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${t.estimated_cost_usd.toFixed(4)}
          </div>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
            Absorbed by your {userPlan} plan
          </p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-bold text-slate-500 dark:text-neutral-400">Credits Remaining</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {creditsLimit === 0 ? 'Unlimited' : creditsLimit}
          </div>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
            Current plan limits
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Detailed Request Logs</h3>
        </div>
        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Không có dữ liệu trong khoảng thời gian này.
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-neutral-900/50 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Thời gian</th>
                  <th className="px-6 py-3 font-semibold">Module</th>
                  <th className="px-6 py-3 font-semibold">Provider / Model</th>
                  <th className="px-6 py-3 font-semibold text-right">Tokens In</th>
                  <th className="px-6 py-3 font-semibold text-right">Tokens Out</th>
                  <th className="px-6 py-3 font-semibold text-right">Total Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                {history.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-slate-900 dark:text-neutral-200 font-medium">
                        {new Date(log.created_at).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-slate-700 dark:text-neutral-300 font-medium">{log.module}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.provider === 'openai' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'}`}>
                          {log.provider}
                        </span>
                        <span className="text-slate-500 dark:text-neutral-400 text-xs">{log.model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-neutral-400">
                      {log.prompt_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-neutral-400">
                      {log.completion_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-neutral-200">
                      {log.total_tokens.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
