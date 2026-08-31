import { useEffect, useState } from "react";
import { getUserBilling } from "../actions";
import { CreditCard, Calendar } from "lucide-react";

export default function BillingTab({ userId }: { userId: string }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserBilling(userId).then(data => {
      setSubs(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="py-20 text-center text-neutral-500 text-sm">Đang tải lịch sử thanh toán...</div>;

  if (subs.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <CreditCard className="w-10 h-10 opacity-20" />
        <p>User này chưa có lịch sử đăng ký gói nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Billing & Subscriptions</h2>
      </div>

      <div className="space-y-4">
        {subs.map((sub) => (
          <div key={sub.id} className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-white uppercase">{sub.plans?.name || "Unknown Plan"}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                  'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}>
                  {sub.status}
                </span>
              </div>
              <div className="text-xs text-neutral-400 font-mono">{sub.id}</div>
            </div>
            
            <div className="flex flex-col md:items-end gap-1 text-sm text-neutral-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-500" />
                Start: <span className="text-white">{new Date(sub.current_period_start).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-500" />
                End: <span className="text-white">{new Date(sub.current_period_end).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
