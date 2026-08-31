import { createAdminClient } from "@/lib/supabase/admin";
import { DollarSign, BarChart3, PieChart, Activity, Zap, HardDrive } from "lucide-react";

export default async function AdminCostPage() {
  const adminClient = createAdminClient();

  const { data: logs } = await adminClient
    .from("ai_api_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // Group by Provider
  const providerCost = logs?.reduce((acc: any, log) => {
    if (!acc[log.provider]) acc[log.provider] = { cost: 0, tokens: 0, reqs: 0 };
    acc[log.provider].cost += (log.total_tokens || 0) * 0.00002; // Roughly $0.02 per 1k tokens for demo
    acc[log.provider].tokens += (log.total_tokens || 0);
    acc[log.provider].reqs += 1;
    return acc;
  }, {}) || {};

  const totalCost = Object.values(providerCost).reduce((acc: number, curr: any) => acc + curr.cost, 0) as number;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            AI Cost Analytics
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Financial telemetry for LLM inferences and compute</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-[#0a0a0a] shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Total Est. Cost (30d)</div>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-semibold text-white">
            ${totalCost.toFixed(2)}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-[#0a0a0a] shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Total Tokens Burned</div>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-semibold text-white">
            {Object.values(providerCost).reduce((a: number, c: any) => a + c.tokens, 0).toLocaleString()}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-[#0a0a0a] shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Total API Requests</div>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-semibold text-white">
            {Object.values(providerCost).reduce((a: number, c: any) => a + c.reqs, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost by Provider */}
        <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-3 border-b border-neutral-800/60 bg-neutral-900/30">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500"/> Cost Breakdown by Provider
            </h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {Object.entries(providerCost).map(([provider, data]: [string, any]) => (
                <div key={provider}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white uppercase font-medium">{provider}</span>
                    <span className="text-neutral-400 font-mono">${data.cost.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${provider === 'kiraai' ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${Math.max(5, (data.cost / totalCost) * 100)}%` }} 
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">{data.tokens.toLocaleString()} tokens / {data.reqs} reqs</div>
                </div>
              ))}
              {Object.keys(providerCost).length === 0 && <div className="text-neutral-500 text-sm">No cost data available.</div>}
            </div>
          </div>
        </div>

        {/* Cost by Feature */}
        <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-3 border-b border-neutral-800/60 bg-neutral-900/30">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500"/> Cost Breakdown by Feature
            </h3>
          </div>
          <div className="p-5 flex items-center justify-center h-48">
            <div className="text-center">
              <HardDrive className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Feature level tracking not fully mapped yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
