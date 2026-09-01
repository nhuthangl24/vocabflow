"use client";

import { Check, X, BookOpen, Brain, Zap, Layers, RefreshCw, Library, Upload, Globe, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

type Plan = Record<string, any>;

const FEATURE_FLAGS = [
  { key: "enable_vocabulary", label: "Từ vựng (Vocabulary)", desc: "Phân tích từ vựng từ video", icon: BookOpen },
  { key: "enable_grammar", label: "Ngữ pháp (Grammar)", desc: "Phân tích cấu trúc ngữ pháp", icon: Brain },
  { key: "enable_shadowing", label: "Phòng Shadowing", desc: "Luyện nói theo video", icon: Zap },
  { key: "enable_flashcards", label: "Flashcards", desc: "Thẻ ghi nhớ", icon: Layers },
  { key: "enable_srs", label: "SRS / FSRS", desc: "Hệ thống ôn tập thông minh", icon: RefreshCw },
  { key: "enable_library", label: "Thư viện cá nhân", desc: "Lưu video của mình", icon: Library },
  { key: "enable_personal_upload", label: "Upload YouTube cá nhân", desc: "User tự upload link YouTube", icon: Upload },
  { key: "enable_system_library", label: "Kho video hệ thống", desc: "Truy cập video Admin upload", icon: Globe },
] as const;

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#ef4444", "#94a3b8",
];

interface PlanFormProps {
  plan?: Plan;
  action: (formData: FormData) => Promise<void>;
  mode: "create" | "edit";
}

export default function PlanForm({ plan, action, mode }: PlanFormProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/plans" className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center hover:border-neutral-600 text-neutral-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">{mode === "create" ? "Tạo gói mới" : `Chỉnh sửa gói ${plan?.name}`}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{mode === "create" ? "Cấu hình một gói dịch vụ mới" : "Cập nhật thông tin và quyền tính năng"}</p>
        </div>
      </div>

      <form action={action} className="space-y-5">
        {/* Section: Thông tin cơ bản */}
        <Section title="Thông tin cơ bản">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tên gói *" name="name" defaultValue={plan?.name} placeholder="VD: PRO" required />
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Giá (VNĐ) *</label>
              <input
                type="number" name="price_usd" defaultValue={plan?.price_usd ?? 0} min="0" step="1000" required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl outline-none text-sm text-white font-mono"
                placeholder="0 = Miễn phí"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Chu kỳ thanh toán</label>
              <select name="billing_period" defaultValue={plan?.billing_period || "monthly"}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl outline-none text-sm text-white">
                <option value="monthly">Hàng tháng</option>
                <option value="yearly">Hàng năm</option>
              </select>
            </div>
            <Field label="Badge text" name="badge_text" defaultValue={plan?.badge_text || ""} placeholder="VD: Phổ biến, Premium, Hot..." />
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Thứ tự hiển thị</label>
              <input type="number" name="sort_order" defaultValue={plan?.sort_order ?? 0} min="0"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl outline-none text-sm text-white font-mono"
              />
            </div>
          </div>

          {/* Color picker */}
          <div className="mt-1">
            <label className="block text-xs font-medium text-neutral-400 mb-2">Màu nhận diện</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="color" value={c} defaultChecked={plan?.color === c || (!plan?.color && c === "#6366f1")} className="sr-only" />
                  <div className="w-7 h-7 rounded-full border-2 border-transparent hover:scale-110 transition-transform"
                    style={{ backgroundColor: c, boxShadow: plan?.color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none" }} />
                </label>
              ))}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-600">Tùy chỉnh:</span>
                <input type="color" name="color_custom" defaultValue={plan?.color || "#6366f1"}
                  className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" />
              </div>
            </div>
          </div>

          <div className="mt-1">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Mô tả</label>
            <textarea name="description" defaultValue={plan?.description || ""} rows={2}
              placeholder="Mô tả ngắn gọn về gói này"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl outline-none text-sm text-white resize-none"
            />
          </div>

          <div className="mt-1">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Danh sách tính năng nổi bật <span className="text-neutral-600">(mỗi dòng 1 tính năng, để trống để tự động)</span></label>
            <textarea name="features_list" defaultValue={plan?.features_list || ""} rows={4}
              placeholder="Hỗ trợ kỹ thuật 24/7&#10;Tham gia cộng đồng VIP&#10;Không giới hạn từ vựng"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl outline-none text-sm text-white resize-none font-mono"
            />
          </div>

          <div className="flex items-center gap-6 mt-2">
            <ToggleField name="is_recommended" label="⭐ Khuyên dùng" defaultChecked={plan?.is_recommended} />
            <ToggleField name="is_active" label="Đang mở bán" defaultChecked={plan?.is_active ?? true} />
          </div>
        </Section>

        {/* Section: Giới hạn */}
        <Section title="Giới hạn sử dụng">
          <p className="text-xs text-neutral-600 mb-3">Nhập 0 = Không giới hạn</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <NumberField label="Video xử lý / ngày" name="daily_video_limit" defaultValue={plan?.daily_video_limit ?? 0} />
            <NumberField label="Thời lượng video Từ vựng (phút)" name="max_video_duration_minutes" defaultValue={plan?.max_video_duration_minutes ?? 0} />
            <NumberField label="Thời lượng video Shadowing (phút)" name="max_shadowing_minutes" defaultValue={plan?.max_shadowing_minutes ?? 0} />
            <NumberField label="Số từ vựng / video" name="max_vocabulary_per_video" defaultValue={plan?.max_vocabulary_per_video ?? 0} />
            <NumberField label="Lượt Shadowing / tháng" name="monthly_shadowing_limit" defaultValue={plan?.monthly_shadowing_limit ?? 0} />
            <NumberField label="AI calls / tháng" name="max_ai_calls_per_month" defaultValue={plan?.max_ai_calls_per_month ?? 0} />
            <NumberField label="Lưu trữ (GB)" name="max_storage_gb" defaultValue={plan?.max_storage_bytes ? Math.round(plan.max_storage_bytes / (1024 ** 3)) : 0} />
            <NumberField label="Max decks" name="max_decks" defaultValue={plan?.max_decks ?? 0} />
            <NumberField label="Flashcards tối đa" name="max_flashcards" defaultValue={plan?.max_flashcards ?? 0} />
            <NumberField label="Retention (ngày)" name="retention_days" defaultValue={plan?.retention_days ?? 30} />
          </div>
        </Section>

        {/* Section: Tính năng */}
        <Section title="Quyền truy cập tính năng">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURE_FLAGS.map(f => (
              <label key={f.key} className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  name={f.key}
                  defaultChecked={plan ? (plan[f.key] ?? true) : true}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <div>
                  <div className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">{f.label}</div>
                  <div className="text-xs text-neutral-600 mt-0.5">{f.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </Section>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/plans" className="px-5 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 text-sm transition-all">
            Hủy
          </Link>
          <button type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
            <Save className="w-4 h-4" />
            {mode === "create" ? "Tạo gói" : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30">
        <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder, required }: {
  label: string; name: string; defaultValue?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">{label}</label>
      <input type="text" name={name} defaultValue={defaultValue || ""} placeholder={placeholder} required={required}
        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl outline-none text-sm text-white"
      />
    </div>
  );
}

function NumberField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">{label}</label>
      <input type="number" name={name} defaultValue={defaultValue ?? 0} min="0"
        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl outline-none text-sm text-white font-mono"
      />
    </div>
  );
}

function ToggleField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input type="checkbox" name={name} defaultChecked={defaultChecked}
        className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
      />
      <span className="text-sm text-neutral-400 group-hover:text-neutral-200 transition-colors">{label}</span>
    </label>
  );
}
