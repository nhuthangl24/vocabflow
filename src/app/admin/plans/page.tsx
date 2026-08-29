import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Edit2, CreditCard, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const supabase = await createClient();
  const { data: plans, error } = await supabase.from('plans').select('*').order('price_usd');

  if (error) {
    return <div className="p-6 text-red-500">Error loading plans: {error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-500" />
            Quản lý gói cước (Plans)
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Cấu hình giá và giới hạn tính năng cho các gói dịch vụ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
        {plans?.map(plan => (
          <Card key={plan.id} className="flex flex-col h-full hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group relative overflow-hidden">
            {plan.is_recommended && (
              <div className="absolute top-4 right-[-32px] bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 w-[120px] text-center rotate-45 shadow-sm">
                Khuyên dùng
              </div>
            )}
            
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <Link href={`/admin/plans/edit/${plan.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 min-h-[40px]">{plan.description}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{plan.price_usd?.toLocaleString('vi-VN')}đ</span>
                <span className="text-sm font-medium text-slate-500"> /tháng</span>
              </div>
            </CardHeader>
            
            <CardContent className="bg-slate-50/50 dark:bg-slate-800/20 flex-1 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Giới hạn & Đặc quyền</h3>
              <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0 last:pb-0">
                  <span className="text-slate-500">Số video / ngày:</span> 
                  <span className="font-bold text-slate-900 dark:text-white">{plan.daily_video_limit === 0 ? "Không giới hạn" : plan.daily_video_limit}</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0 last:pb-0">
                  <span className="text-slate-500">Thời lượng tối đa:</span> 
                  <span className="font-bold text-slate-900 dark:text-white">{plan.max_video_duration_minutes === 0 ? "Không giới hạn" : `${plan.max_video_duration_minutes} phút`}</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0 last:pb-0">
                  <span className="text-slate-500">Phòng Shadowing:</span> 
                  {plan.enable_shadowing ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded text-xs"><Check className="w-3 h-3" /> Bật</span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs"><X className="w-3 h-3" /> Tắt</span>
                  )}
                </li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
