"use client";

import { Clock, CreditCard, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type Order = {
  id: string;
  plan_id: string;
  amount: number;
  original_amount: number;
  discount_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  transfer_content: string;
};

export default function BillingHistory({ orders }: { orders: Order[] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="w-full p-8 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center">
        <CreditCard className="w-12 h-12 text-slate-300 dark:text-neutral-700 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chưa có lịch sử thanh toán</h3>
        <p className="text-sm text-slate-500 mt-1">Bạn chưa thực hiện bất kỳ giao dịch nào.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Lịch sử giao dịch
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-[#0a0a0a] text-slate-500 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">Mã Đơn</th>
              <th className="px-6 py-4 font-medium">Gói Cước</th>
              <th className="px-6 py-4 font-medium">Ngày Tạo</th>
              <th className="px-6 py-4 font-medium text-right">Tổng Tiền</th>
              <th className="px-6 py-4 font-medium">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/30 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  {order.transfer_content}
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-900 dark:text-white uppercase">
                    {order.plan_id}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-neutral-400">
                  {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  <span className="text-xs ml-2 opacity-50 hidden sm:inline">
                    ({formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: vi })})
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {order.amount.toLocaleString('vi-VN')}đ
                  </div>
                  {(order.discount_amount || 0) > 0 && (
                    <div className="text-xs text-emerald-500 line-through">
                      {(order.amount + order.discount_amount).toLocaleString('vi-VN')}đ
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    order.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                      : order.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                  }`}>
                    {order.status === 'approved' ? 'Thành công' : order.status === 'pending' ? 'Đang xử lý' : 'Đã hủy'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
