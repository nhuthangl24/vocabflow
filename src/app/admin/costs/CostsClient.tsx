"use client";

import { CreditCard, TrendingUp, Users, LayoutDashboard, Search, ArrowLeft, Calendar, Activity } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

function calculateCost(provider: string, inputTokens: number, outputTokens: number): number {
  const p = (provider || '').toLowerCase();
  if (p === 'hhtech' || p === 'anthropic' || p === 'hhtech_anthropic') {
    return (inputTokens * 900 / 1000000) + (outputTokens * 4500 / 1000000);
  }
  return 0;
}

function getLogCost(l: any): number {
  if (l.cost_usd && Number(l.cost_usd) > 0) return Number(l.cost_usd);
  return calculateCost(l.provider, l.input_tokens || 0, l.output_tokens || 0);
}

export function CostsClient({ logs, userMap }: { logs: any[], userMap?: Record<string, { email: string; name: string }> }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const validLogs = logs.filter(l => l.provider !== 'TEST' && l.task_type !== 'test');

  const totalCost = validLogs.reduce((acc, l) => acc + getLogCost(l), 0);
  const totalTokens = validLogs.reduce((acc, l) => acc + (l.input_tokens || 0) + (l.output_tokens || 0), 0);

  // Group by Provider
  const providerStats = validLogs.reduce((acc, l) => {
    const prov = (l.provider || 'unknown').toUpperCase();
    if (!acc[prov]) acc[prov] = 0;
    acc[prov] += getLogCost(l);
    return acc;
  }, {} as Record<string, number>);

  const providerChart = (Object.entries(providerStats) as [string, number][]).map(([name, cost]) => ({
    name,
    cost,
    percentage: totalCost ? (cost / totalCost) * 100 : 0
  })).sort((a, b) => b.cost - a.cost);

  // Group by Task Type
  const taskStats = validLogs.reduce((acc, l) => {
    const task = l.task_type || 'unknown';
    if (!acc[task]) acc[task] = 0;
    acc[task] += getLogCost(l);
    return acc;
  }, {} as Record<string, number>);

  const taskChart = (Object.entries(taskStats) as [string, number][]).map(([name, cost]) => ({
    name,
    cost,
    percentage: totalCost ? (cost / totalCost) * 100 : 0
  })).sort((a, b) => b.cost - a.cost);

  const fmtVND = (credit: number) => `${(credit / 1000).toFixed(4)} VND`;
  const fmtCredit = (credit: number) => `${credit.toFixed(1)} Cr`;

  // Group by User
  const userStats = validLogs.reduce((acc, l) => {
    const uid = l.user_id || 'system';
    if (!acc[uid]) acc[uid] = { cost: 0, tokens: 0, calls: 0 };
    acc[uid].cost += getLogCost(l);
    acc[uid].tokens += (l.input_tokens || 0) + (l.output_tokens || 0);
    acc[uid].calls += 1;
    return acc;
  }, {} as Record<string, { cost: number; tokens: number; calls: number }>);

  const userChart = Object.entries(userStats).map(([uid, stats]) => ({
    uid,
    ...stats,
    label: userMap?.[uid]?.name || userMap?.[uid]?.email || uid.substring(0, 8),
    email: userMap?.[uid]?.email || '',
    percentage: totalCost ? (stats.cost / totalCost) * 100 : 0,
  })).sort((a, b) => b.cost - a.cost);

  const filteredUsers = userChart.filter(u => 
    !searchQuery || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedUser) {
    const uid = selectedUser;
    const userLogs = validLogs.filter(l => (l.user_id || 'system') === uid).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Calculate today
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogs = userLogs.filter(l => new Date(l.created_at).toISOString().slice(0, 10) === todayStr);
    
    // Breakdown tokens by provider
    const getProviderTokens = (logsToCalc: any[]) => {
      const pTokens: Record<string, number> = {};
      logsToCalc.forEach(l => {
        const p = l.provider === 'HHTECH_ANTHROPIC' ? 'HHTECH' : (l.provider || 'UNKNOWN').toUpperCase();
        if (p === 'TEST') return; // Ignore TEST provider
        if (!pTokens[p]) pTokens[p] = 0;
        pTokens[p] += (l.input_tokens || 0) + (l.output_tokens || 0);
      });
      return pTokens;
    };

    const todayTokensByProv = getProviderTokens(todayLogs);
    const totalTokensByProv = getProviderTokens(userLogs);

    const todayCost = todayLogs.reduce((acc, l) => acc + getLogCost(l), 0);
    const totalCostUser = userLogs.reduce((acc, l) => acc + getLogCost(l), 0);
    
    const label = userMap?.[uid]?.name || userMap?.[uid]?.email || (uid === 'system' ? 'System' : uid.substring(0, 8));
    const email = userMap?.[uid]?.email || '';

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <div>
          <button 
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors group mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại danh sách
          </button>

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{label}</h1>
            {email && <p className="text-sm text-neutral-500 mt-1">{email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#111] border border-emerald-900/30 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Calendar className="w-24 h-24" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-2">Hôm nay ({todayStr})</p>
              <div className="flex items-baseline gap-3 mb-2">
                <h3 className="text-4xl font-mono text-emerald-400 font-bold">{fmtVND(todayCost)}</h3>
                <span className="text-neutral-500 font-mono text-sm">{fmtCredit(todayCost)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-900/30 flex flex-wrap gap-4 text-xs">
              <div className="text-neutral-500">Số Request: <span className="text-white font-mono">{todayLogs.length}</span></div>
              {Object.entries(todayTokensByProv).map(([p, tk]) => (
                <div key={p} className="text-neutral-500">{p} Tokens: <span className="text-emerald-400 font-mono">{tk.toLocaleString("vi-VN")}</span></div>
              ))}
            </div>
          </div>

          <div className="bg-[#111] border border-neutral-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Activity className="w-24 h-24" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Tổng cộng (30 ngày)</p>
              <div className="flex items-baseline gap-3 mb-2">
                <h3 className="text-4xl font-mono text-white font-bold">{fmtVND(totalCostUser)}</h3>
                <span className="text-neutral-500 font-mono text-sm">{fmtCredit(totalCostUser)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap gap-4 text-xs">
              <div className="text-neutral-500">Số Request: <span className="text-white font-mono">{userLogs.length}</span></div>
              {Object.entries(totalTokensByProv).map(([p, tk]) => (
                <div key={p} className="text-neutral-500">{p} Tokens: <span className="text-neutral-300 font-mono">{tk.toLocaleString("vi-VN")}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-neutral-800 rounded-xl mt-6">
          <div className="px-5 py-3 border-b border-neutral-800 bg-[#151515] rounded-t-xl">
            <h3 className="text-sm font-semibold text-white">Lịch sử Request gần đây</h3>
          </div>
          <div className="w-full max-h-[400px] overflow-y-auto">
            <table className="w-full text-[12px] font-mono text-left">
              <thead className="bg-[#151515] text-neutral-500 border-b border-neutral-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 font-medium">Thời gian</th>
                  <th className="px-4 py-2 font-medium">Loại Task</th>
                  <th className="px-4 py-2 font-medium">Provider</th>
                  <th className="px-4 py-2 font-medium text-right">Tokens</th>
                  <th className="px-4 py-2 font-medium text-right">Chi phí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {userLogs.slice(0, 50).map((l, i) => {
                  const tCost = getLogCost(l);
                  const tTokens = (l.input_tokens || 0) + (l.output_tokens || 0);
                  return (
                    <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-4 py-2.5 text-neutral-400">
                        {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-300 capitalize">{(l.task_type || 'unknown').replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5 text-neutral-500 uppercase">{l.provider === 'HHTECH_ANTHROPIC' ? 'HHTECH' : l.provider}</td>
                      <td className="px-4 py-2.5 text-right text-neutral-300">{tTokens.toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="text-emerald-400">{fmtVND(tCost)}</div>
                        <div className="text-neutral-600 text-[10px]">{fmtCredit(tCost)}</div>
                      </td>
                    </tr>
                  );
                })}
                {userLogs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-600 font-sans">Chưa có request nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          Quản lý Chi phí AI
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Phân tích chi phí theo Provider và theo Task Type (Mặc định 30 ngày qua).</p>
      </div>

      <div className="flex items-center gap-2 border-b border-neutral-800 pb-4">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'overview' ? 'bg-emerald-500/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Tổng quan
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'users' ? 'bg-blue-500/10 text-blue-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
        >
          <Users className="w-4 h-4" />
          Theo Tài khoản
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#111] border border-neutral-800 rounded-xl p-6 flex flex-col justify-between max-w-sm">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neutral-400" />
              Tổng chi phí
            </p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-5xl font-mono text-emerald-400 font-bold">{fmtVND(totalCost)}</h3>
              <span className="text-neutral-500 font-mono text-sm">{fmtCredit(totalCost)}</span>
            </div>
            <p className="text-xs text-neutral-600 mt-2">{totalTokens.toLocaleString("vi-VN")} tokens • {logs.length} requests</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-6">Chi phí theo Provider</h3>
              <div className="space-y-4">
                {providerChart.map(p => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-300 uppercase tracking-wider font-semibold">{p.name === 'HHTECH_ANTHROPIC' ? 'HHTECH' : p.name}</span>
                      <div className="text-right">
                        <div className="text-emerald-400 font-mono text-xs">{fmtVND(p.cost)}</div>
                        <div className="text-neutral-600 font-mono text-[10px]">{fmtCredit(p.cost)}</div>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${p.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
                {providerChart.length === 0 && <p className="text-xs text-neutral-600">Không có dữ liệu chi phí.</p>}
              </div>
            </div>

            <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-6">Chi phí theo loại Task</h3>
              <div className="space-y-4">
                {taskChart.map(t => (
                  <div key={t.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-300 capitalize">{t.name.replace(/_/g, ' ')}</span>
                      <div className="text-right">
                        <div className="text-purple-400 font-mono text-xs">{fmtVND(t.cost)}</div>
                        <div className="text-neutral-600 font-mono text-[10px]">{fmtCredit(t.cost)}</div>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${t.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
                {taskChart.length === 0 && <p className="text-xs text-neutral-600">Không có dữ liệu chi phí.</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#111] border border-neutral-800 rounded-xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="px-5 py-3 border-b border-neutral-800 bg-[#151515] flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Chi phí theo Tài khoản</h3>
              <span className="text-xs text-neutral-500 ml-2">({filteredUsers.length} users)</span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Tìm email, tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111] border border-neutral-800 text-sm rounded-md pl-9 pr-4 py-1.5 focus:outline-none focus:border-neutral-600 text-white w-64"
              />
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredUsers.map(u => (
                <div 
                  key={u.uid}
                  onClick={() => setSelectedUser(u.uid)}
                  className="bg-[#151515] border border-neutral-800 rounded-xl p-4 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <h4 className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors line-clamp-1">{u.label}</h4>
                    <p className="text-neutral-500 text-xs font-sans mt-0.5 line-clamp-1">{u.email || '—'}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <span className="text-xs text-neutral-500">Chi phí</span>
                      <div className="text-right">
                        <div className="text-emerald-400 font-mono text-sm font-semibold">{fmtVND(u.cost)}</div>
                        <div className="text-neutral-600 font-mono text-[10px]">{fmtCredit(u.cost)}</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs border-t border-neutral-800/50 pt-3">
                      <div className="text-neutral-500">
                        Tokens: <span className="text-neutral-300 font-mono">{u.tokens.toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="text-neutral-500">
                        Req: <span className="text-neutral-300 font-mono">{u.calls}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-neutral-600 text-sm font-sans">
                Không tìm thấy tài khoản nào.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
