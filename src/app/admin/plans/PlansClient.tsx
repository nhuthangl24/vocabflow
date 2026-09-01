"use client";

import { useState, useTransition } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Check, X, Users, CreditCard,
  Zap, BookOpen, Brain, Layers, Library, Upload, Globe, HardDrive,
  Cpu, GripVertical, Star, ChevronRight, Badge, Palette, RefreshCw,
} from "lucide-react";
import { deletePlan, togglePlanActive } from "./actions";
import toast from "react-hot-toast";
import Link from "next/link";

type Plan = {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  billing_period: string;
  color: string;
  badge_text: string | null;
  sort_order: number;
  is_recommended: boolean;
  is_active: boolean;
  features_list: string | null;
  daily_video_limit: number;
  max_video_duration_minutes: number;
  max_shadowing_minutes: number;
  max_vocabulary_per_video: number;
  monthly_shadowing_limit: number;
  max_storage_bytes: number;
  max_ai_calls_per_month: number;
  enable_shadowing: boolean;
  enable_vocabulary: boolean;
  enable_grammar: boolean;
  enable_flashcards: boolean;
  enable_srs: boolean;
  enable_library: boolean;
  enable_personal_upload: boolean;
  enable_system_library: boolean;
  subscriber_count: number;
  updated_at: string;
};

const FEATURE_FLAGS = [
  { key: "enable_vocabulary", label: "Từ vựng (Vocab)", icon: BookOpen },
  { key: "enable_grammar", label: "Ngữ pháp (Grammar)", icon: Brain },
  { key: "enable_shadowing", label: "Shadowing", icon: Zap },
  { key: "enable_flashcards", label: "Flashcards", icon: Layers },
  { key: "enable_srs", label: "SRS (FSRS)", icon: RefreshCw },
  { key: "enable_library", label: "Thư viện (Library)", icon: Library },
  { key: "enable_personal_upload", label: "Upload YouTube cá nhân", icon: Upload },
  { key: "enable_system_library", label: "Kho video hệ thống", icon: Globe },
] as const;

function fmtPrice(p: number) {
  if (p === 0) return "Miễn phí";
  return p.toLocaleString("vi-VN") + "đ";
}

function fmtBytes(b: number) {
  if (!b) return "Không giới hạn";
  const gb = b / (1024 ** 3);
  return gb >= 1 ? `${gb.toFixed(0)} GB` : `${(b / (1024 ** 2)).toFixed(0)} MB`;
}

function fmtLimit(v: number, suffix = "") {
  if (!v) return "Không giới hạn";
  return `${v}${suffix}`;
}

// ─── Preview Card (mimics pricing page) ─────────────────────────────────────

function PricingPreviewCard({ plan }: { plan: Plan }) {
  const features = plan.features_list
    ? plan.features_list.split("\n").filter(Boolean)
    : FEATURE_FLAGS.filter(f => (plan as any)[f.key]).map(f => f.label);

  return (
    <div
      className="relative rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: `${plan.color}40`, background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)" }}
    >
      {/* Top accent */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(to right, transparent, ${plan.color}, transparent)` }} />

      {plan.badge_text && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{ color: plan.color, borderColor: `${plan.color}50`, background: `${plan.color}15` }}>
            {plan.badge_text}
          </span>
        </div>
      )}

      <div className="p-6 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">{plan.name}</span>
        </div>
        <div className="mt-3 mb-1">
          <span className="text-4xl font-black text-white">{fmtPrice(plan.price_usd)}</span>
          {plan.price_usd > 0 && <span className="text-neutral-500 text-sm ml-1">/{plan.billing_period === "monthly" ? "tháng" : "năm"}</span>}
        </div>
        <p className="text-neutral-500 text-xs mt-2 mb-5">{plan.description}</p>

        <div className="space-y-2">
          {features.slice(0, 6).map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
              <Check className="w-3 h-3 shrink-0" style={{ color: plan.color }} />
              {f}
            </div>
          ))}
          {features.length > 6 && (
            <div className="text-xs text-neutral-600">+{features.length - 6} tính năng khác</div>
          )}
        </div>
      </div>

      <div className="p-6 pt-0">
        <button
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: plan.is_recommended ? plan.color : "transparent", border: `1px solid ${plan.color}`, color: plan.is_recommended ? "white" : plan.color }}
        >
          {plan.price_usd === 0 ? "Dùng miễn phí" : "Đăng ký ngay"}
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────

function DeleteModal({ plan, onClose, onConfirm }: { plan: Plan; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Xóa gói {plan.name}?</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Hành động này không thể hoàn tác.</p>
          </div>
        </div>
        {plan.subscriber_count > 0 && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            ⚠ Gói này đang có {plan.subscriber_count} user active. Cần chuyển user trước khi xóa.
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-sm hover:bg-neutral-700 transition-colors">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={plan.subscriber_count > 0}
            className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Xóa gói
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PlansClient({ plans: initialPlans }: { plans: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [activeTab, setActiveTab] = useState<"list" | "preview">("list");
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleActive = (plan: Plan) => {
    startTransition(async () => {
      const toastId = toast.loading(plan.is_active ? "Đang ẩn gói..." : "Đang hiển thị gói...");
      try {
        await togglePlanActive(plan.id, !plan.is_active);
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
        toast.success(plan.is_active ? "Đã ẩn gói" : "Đã hiển thị gói", { id: toastId });
      } catch (e: any) {
        toast.error(e.message, { id: toastId });
      }
    });
  };

  const handleDelete = (plan: Plan) => {
    setDeleteTarget(plan);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const plan = deleteTarget;
    startTransition(async () => {
      const toastId = toast.loading("Đang xóa...");
      try {
        await deletePlan(plan.id);
        setPlans(prev => prev.filter(p => p.id !== plan.id));
        toast.success(`Đã xóa gói ${plan.name}`, { id: toastId });
      } catch (e: any) {
        toast.error(e.message, { id: toastId });
      } finally {
        setDeleteTarget(null);
      }
    });
  };

  const activePlans = plans.filter(p => p.is_active);
  const inactivePlans = plans.filter(p => !p.is_active);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal plan={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Quản lý Plans
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">{plans.length} gói — {activePlans.length} đang bán • {inactivePlans.length} ẩn</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-900 border border-neutral-800">
            <button onClick={() => setActiveTab("list")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
              Danh sách
            </button>
            <button onClick={() => setActiveTab("preview")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "preview" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
              <Eye className="w-3 h-3" /> Preview
            </button>
          </div>
          <Link
            href="/admin/plans/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Tạo gói mới
          </Link>
        </div>
      </div>

      {/* Tab: Preview */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="px-4 py-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            Đây là giao diện mà user thấy tại trang <strong>/pricing</strong>. Chỉ hiển thị gói <strong>is_active = true</strong>.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activePlans.sort((a, b) => a.sort_order - b.sort_order).map(plan => (
              <PricingPreviewCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {/* Tab: List */}
      {activeTab === "list" && (
        <div className="space-y-3">
          {plans.sort((a, b) => a.sort_order - b.sort_order).map(plan => (
            <PlanRow
              key={plan.id}
              plan={plan}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Plan Row ────────────────────────────────────────────────────────────────

function PlanRow({
  plan,
  onToggleActive,
  onDelete,
}: {
  plan: Plan;
  onToggleActive: (p: Plan) => void;
  onDelete: (p: Plan) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const enabledFeatures = FEATURE_FLAGS.filter(f => (plan as any)[f.key]);
  const disabledFeatures = FEATURE_FLAGS.filter(f => !(plan as any)[f.key]);

  return (
    <div className={`rounded-xl border transition-all ${plan.is_active ? "border-neutral-800/60 bg-[#0a0a0a]" : "border-neutral-800/30 bg-neutral-950/60 opacity-60"}`}>
      {/* Accent bar */}
      <div className="h-0.5 rounded-t-xl" style={{ background: `linear-gradient(to right, ${plan.color}60, ${plan.color}, ${plan.color}60)` }} />

      <div className="p-5">
        {/* Main row */}
        <div className="flex items-center gap-4">
          {/* Color + name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${plan.color}20`, border: `1px solid ${plan.color}40` }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">{plan.name}</span>
                {plan.badge_text && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border" style={{ color: plan.color, borderColor: `${plan.color}50`, background: `${plan.color}10` }}>
                    {plan.badge_text}
                  </span>
                )}
                {plan.is_recommended && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    ⭐ Khuyên dùng
                  </span>
                )}
                {!plan.is_active && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-500">
                    ẨN
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 truncate">{plan.description}</p>
            </div>
          </div>

          {/* Price */}
          <div className="shrink-0 text-right">
            <div className="font-bold text-white text-sm">{fmtPrice(plan.price_usd)}</div>
            <div className="text-[10px] text-neutral-600">/{plan.billing_period === "monthly" ? "tháng" : "năm"}</div>
          </div>

          {/* Subscribers */}
          <div className="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 min-w-[60px]">
            <Users className="w-3.5 h-3.5 text-neutral-600" />
            <span className="font-mono">{plan.subscriber_count}</span>
          </div>

          {/* Feature chips */}
          <div className="hidden xl:flex items-center gap-1 flex-wrap max-w-[280px]">
            {enabledFeatures.slice(0, 5).map(f => (
              <span key={f.key} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Check className="w-2 h-2" /> {f.label.split(" ")[0]}
              </span>
            ))}
            {enabledFeatures.length > 5 && (
              <span className="text-[9px] text-neutral-600">+{enabledFeatures.length - 5}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpanded(v => !v)}
              className="px-2 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
            <button
              onClick={() => onToggleActive(plan)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                plan.is_active
                  ? "bg-neutral-800 text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10"
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }`}
              title={plan.is_active ? "Ẩn gói" : "Hiển thị gói"}
            >
              {plan.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {plan.is_active ? "Ẩn" : "Hiện"}
            </button>
            <Link
              href={`/admin/plans/edit/${plan.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" /> Sửa
            </Link>
            <button
              onClick={() => onDelete(plan)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-5 pt-5 border-t border-neutral-800/60 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Limits */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">Giới hạn</h4>
              <div className="space-y-2">
                <LimitRow label="Video / ngày" value={fmtLimit(plan.daily_video_limit, " video")} />
                <LimitRow label="Video Từ vựng (phút)" value={fmtLimit(plan.max_video_duration_minutes, " phút")} />
                <LimitRow label="Video Shadowing (phút)" value={fmtLimit(plan.max_shadowing_minutes, " phút")} />
                <LimitRow label="Từ vựng/video" value={fmtLimit(plan.max_vocabulary_per_video, " từ")} />
                <LimitRow label="Shadowing / tháng" value={fmtLimit(plan.monthly_shadowing_limit, " lượt")} />
                <LimitRow label="AI calls / tháng" value={fmtLimit(plan.max_ai_calls_per_month, " lần")} />
                <LimitRow label="Lưu trữ" value={fmtBytes(plan.max_storage_bytes)} />
              </div>
            </div>

            {/* Feature toggles */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">Tính năng</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {FEATURE_FLAGS.map(f => {
                  const enabled = (plan as any)[f.key];
                  return (
                    <div key={f.key} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${enabled ? "bg-emerald-500/8 text-emerald-400" : "bg-neutral-900 text-neutral-600"}`}>
                      {enabled
                        ? <Check className="w-3 h-3 shrink-0 text-emerald-400" />
                        : <X className="w-3 h-3 shrink-0 text-neutral-700" />
                      }
                      {f.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-500">{label}</span>
      <span className={`font-mono font-medium ${value === "Không giới hạn" ? "text-emerald-400" : "text-neutral-300"}`}>{value}</span>
    </div>
  );
}
