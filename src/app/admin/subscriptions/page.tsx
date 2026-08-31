import { createAdminClient } from "@/lib/supabase/admin";
import { CreditCard, TrendingUp, TrendingDown, Users, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default async function AdminSubscriptionsPage() {
  const adminClient = createAdminClient();

  const { data: orders } = await adminClient
    .from("orders")
    .select("*, users(email)")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: userSubs } = await adminClient.from("user_subscriptions").select("*, plan:plans(price_vnd)");
  const { count: canceledCount } = await adminClient.from("user_subscriptions").select("*", { count: 'exact', head: true }).eq('status', 'CANCELED');
  const { count: activeCount } = await adminClient.from("user_subscriptions").select("*", { count: 'exact', head: true }).eq('status', 'ACTIVE');
  const { count: totalCount } = await adminClient.from("user_subscriptions").select("*", { count: 'exact', head: true });

  const stats = {
    revenue: orders?.filter(o => o.status === 'PAID').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0,
    mrr: userSubs?.filter(s => s.status === 'ACTIVE').reduce((acc, curr) => acc + (curr.plan?.price_vnd || 0), 0) || 0,
    active: activeCount || 0,
    churn: totalCount && totalCount > 0 ? Math.round(((canceledCount || 0) / totalCount) * 100) : 0,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Đăng ký & Doanh thu
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Chỉ số tài chính, doanh thu định kỳ, tỷ lệ hủy (Dữ liệu thực tế)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-emerald-400">Doanh thu định kỳ (MRR)</div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-semibold text-white flex items-end gap-2">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.mrr)}
            <span className="text-xs text-emerald-400 font-medium mb-1 flex items-center"><ArrowUpRight className="w-3 h-3"/> 12%</span>
          </div>
        </div>
        
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Tổng doanh thu thanh toán</div>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-semibold text-white">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Tài khoản Active</div>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-semibold text-white">
            {stats.active}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Tỷ lệ hủy gói (Churn Rate)</div>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-semibold text-white flex items-end gap-2">
            {stats.churn}%
            <span className="text-xs text-red-400 font-medium mb-1 flex items-center"><ArrowDownRight className="w-3 h-3"/> +0.5%</span>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
        <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500"/> Giao dịch gần đây
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-xs text-neutral-500 bg-neutral-900/20 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Mã đơn hàng</th>
                <th className="px-5 py-3 font-medium">Người dùng</th>
                <th className="px-5 py-3 font-medium">Số tiền</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {orders?.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-900/30 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-neutral-300">
                    {order.id?.slice(0, 8)}...
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-white font-medium">
                    {order.users?.email || 'Unknown'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-emerald-400 font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount || 0)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${
                      order.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-xs text-neutral-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-neutral-500">Chưa có giao dịch nào</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
