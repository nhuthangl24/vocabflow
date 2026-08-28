import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updatePlan } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditPlanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: plan, error } = await supabase.from('plans').select('*').eq('id', params.id).single();

  if (error) {
    console.error("Error fetching plan:", error);
  }

  if (!plan) {
    notFound();
  }

  const updatePlanWithId = updatePlan.bind(null, plan.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/plans" className="p-2 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-neutral-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chỉnh sửa gói cước</h1>
          <p className="text-slate-500 dark:text-neutral-400 mt-1 uppercase">{plan.name}</p>
        </div>
      </div>

      <form action={updatePlanWithId} className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6 space-y-6 text-slate-900 dark:text-neutral-200">
        
        {/* Basic Info */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên gói cước</label>
              <input type="text" name="name" defaultValue={plan.name} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giá (VNĐ)</label>
              <input type="number" name="price_usd" defaultValue={plan.price_usd} required placeholder="VD: 69,000" className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input type="checkbox" name="is_recommended" defaultChecked={plan.is_recommended} className="w-4 h-4 rounded border-slate-300 dark:border-neutral-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-neutral-900" />
            <span className="text-sm font-medium">Đánh dấu là gói "Khuyên dùng" (Nổi bật màu vàng)</span>
          </label>

          <div>
            <label className="block text-sm font-medium mb-1 mt-3">Mô tả</label>
            <textarea name="description" defaultValue={plan.description || ""} rows={1} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Các tính năng nổi bật (Mỗi tính năng 1 dòng)</label>
            <textarea name="features_list" defaultValue={plan.features_list || ""} rows={3} placeholder="Ví dụ:&#10;Hỗ trợ kỹ thuật 24/7&#10;Tham gia cộng đồng học tập VIP" className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"></textarea>
            <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">Nếu để trống, hệ thống sẽ hiển thị các giới hạn bên dưới làm danh sách tính năng.</p>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-neutral-800" />

        {/* Feature Limits & Perks */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Giới hạn chức năng & Đặc quyền</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Số video xử lý / ngày <span className="text-slate-500 dark:text-neutral-500 text-xs font-normal">(0 = Không giới hạn)</span></label>
              <input type="number" name="daily_video_limit" defaultValue={plan.daily_video_limit} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Độ dài tối đa 1 video (phút) <span className="text-slate-500 dark:text-neutral-500 text-xs font-normal">(0 = Không giới hạn)</span></label>
              <input type="number" name="max_video_duration_minutes" defaultValue={plan.max_video_duration_minutes} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input type="checkbox" name="enable_shadowing" defaultChecked={plan.enable_shadowing} className="w-4 h-4 rounded border-slate-300 dark:border-neutral-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-neutral-900" />
            <span className="text-sm font-medium">Bật tính năng Phòng luyện Shadowing cho gói này</span>
          </label>
        </div>

        {/* Hidden inputs to keep old schema happy during save, we default them to 0 or something safely */}
        <input type="hidden" name="monthly_video_count" value="0" />
        <input type="hidden" name="monthly_transcription_minutes" value="0" />
        <input type="hidden" name="max_vocabulary_per_video" value="0" />
        <input type="hidden" name="max_decks" value="0" />
        <input type="hidden" name="max_upload_bytes" value="0" />

        <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-neutral-800">
          <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm">
            <Save className="w-4 h-4" />
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
