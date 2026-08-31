import { createAdminClient } from "@/lib/supabase/admin";
import { CreditCard, ArrowUpRight, Search, Filter } from "lucide-react";

export default async function AdminPaymentsPage() {
  const adminClient = createAdminClient();

  // Fetch recent orders
  const { data: orders } = await adminClient
    .from("orders")
    .select("*, plans(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Payments & Revenue</h2>
          <p className="text-sm text-neutral-400 mt-1">Transaction history and financial metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-300 hover:text-white hover:border-neutral-700 transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search order ID..." 
              className="pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Total Revenue</div>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-white">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              orders?.filter(o => o.status === 'PAID').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0
            )}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Successful Transactions</div>
          </div>
          <div className="text-2xl font-semibold text-white">
            {orders?.filter(o => o.status === 'PAID').length || 0}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="text-xs text-neutral-500 bg-neutral-900/50 uppercase tracking-wider border-b border-neutral-800/60">
            <tr>
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Plan</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {orders?.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-neutral-300 font-mono text-xs">
                  {order.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.user_id?.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(order.plans as any)?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    order.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                  {new Date(order.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!orders || orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">No transactions found</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
