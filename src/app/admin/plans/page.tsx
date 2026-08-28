import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Edit2, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const supabase = await createClient();
  const { data: plans, error } = await supabase.from('plans').select('*').order('price_usd');

  if (error) {
    return <div className="p-6 text-red-500">Error loading plans: {error.message}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-500" />
            Quản lý gói cước (Plans)
          </h1>
          <p className="text-slate-500 dark:text-neutral-400 mt-1">Cấu hình giá và giới hạn tính năng cho các gói dịch vụ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {plans?.map(plan => (
          <div key={plan.id} className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h2>
                <Link href={`/admin/plans/edit/${plan.id}`} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400">
                  <Edit2 className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-sm text-slate-500 dark:text-neutral-400 min-h-[40px]">{plan.description}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{plan.price_usd?.toLocaleString('vi-VN')}đ</span>
                <span className="text-sm text-slate-500"> /tháng</span>
              </div>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-white/5 flex-1 rounded-b-xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Giới hạn tính năng & Đặc quyền</h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-neutral-300">
                <li className="flex justify-between"><span>Số video xử lý / ngày:</span> <span className="font-medium">{plan.daily_video_limit === 0 ? "Không giới hạn" : plan.daily_video_limit}</span></li>
                <li className="flex justify-between"><span>Độ dài tối đa 1 video:</span> <span className="font-medium">{plan.max_video_duration_minutes === 0 ? "Không giới hạn" : `${plan.max_video_duration_minutes} phút`}</span></li>
                <li className="flex justify-between"><span>Phòng Shadowing:</span> <span className="font-medium">{plan.enable_shadowing ? "Bật" : "Tắt"}</span></li>
                <li className="flex justify-between"><span>Khuyên dùng:</span> <span className="font-medium">{plan.is_recommended ? "Có" : "Không"}</span></li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
