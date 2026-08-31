import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Activity, Clock, Cpu, CreditCard, Video, Zap } from "lucide-react";

export default function OverviewTab({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Tổng quan tài khoản</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Gói hiện tại</div>
          <div className={`text-lg font-bold ${user.current_plan === 'PRO' ? 'text-indigo-400' : 'text-white'}`}>{user.current_plan}</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Đăng ký từ</div>
          <div className="text-lg font-bold text-white">{new Date(user.registered_at).toLocaleDateString("vi-VN")}</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Lần cuối HĐ</div>
          <div className="text-sm font-bold text-white mt-1">
            {user.last_active_at ? formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true, locale: vi }) : "Chưa rõ"}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="text-xs text-neutral-500 mb-1">Quốc gia</div>
          <div className="text-lg font-bold text-white">{user.last_country || "N/A"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Học tập</h3>
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-neutral-400 flex items-center gap-2"><Video className="w-4 h-4 text-emerald-400" /> Tổng Videos đã học</span>
              <span className="font-bold text-white">{user.total_videos || 0}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-neutral-400 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" /> Số phiên học</span>
              <span className="font-bold text-white">{user.total_sessions || 0}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-neutral-400 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Chuỗi học (Streak)</span>
              <span className="font-bold text-white">{user.current_streak || 0} ngày</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Tiêu thụ AI</h3>
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-neutral-400 flex items-center gap-2"><Cpu className="w-4 h-4 text-rose-400" /> Tổng Token AI</span>
              <span className="font-bold text-white">{(user.total_tokens_used || 0).toLocaleString()}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-neutral-400 flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-400" /> Chi phí quy đổi</span>
              <span className="font-bold text-emerald-400">{(user.total_credits_used || 0).toLocaleString()} VNĐ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
