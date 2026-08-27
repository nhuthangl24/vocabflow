import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updatePlan } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditPlanPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: plan } = await supabase.from('plans').select('*').eq('id', params.id).single();

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
          <p className="text-slate-500 dark:text-neutral-400 mt-1">{plan.name}</p>
        </div>
      </div>

      <form action={updatePlanWithId} className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6 space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Tên gói cước</label>
              <input type="text" name="name" defaultValue={plan.name} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Giá (VNĐ)</label>
              <input type="number" name="price_usd" defaultValue={plan.price_usd} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Mô tả</label>
            <textarea name="description" defaultValue={plan.description || ""} rows={3} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"></textarea>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-neutral-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Giới hạn chức năng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Số video xử lý / tháng</label>
              <input type="number" name="monthly_video_count" defaultValue={plan.monthly_video_count} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Tổng thời lượng video (phút/tháng)</label>
              <input type="number" name="monthly_transcription_minutes" defaultValue={plan.monthly_transcription_minutes} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Số từ vựng lưu trữ / video</label>
              <input type="number" name="max_vocabulary_per_video" defaultValue={plan.max_vocabulary_per_video} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Số bộ từ vựng (Decks) tối đa</label>
              <input type="number" name="max_decks" defaultValue={plan.max_decks} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Kích thước file upload tối đa (MB)</label>
              <input type="number" name="max_upload_bytes" defaultValue={Math.floor(plan.max_upload_bytes / (1024 * 1024))} required className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
            <Save className="w-4 h-4" />
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
