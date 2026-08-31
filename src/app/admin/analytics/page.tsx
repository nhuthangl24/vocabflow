import { createAdminClient } from "@/lib/supabase/admin";
import { LineChart, BarChart3, Users, Clock, BrainCircuit } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const adminClient = createAdminClient();

  const { count: users } = await adminClient.from("users").select("*", { count: 'exact', head: true });
  const { count: activeSubs } = await adminClient.from("user_subscriptions").select("*", { count: 'exact', head: true }).eq('status', 'ACTIVE');
  const { count: totalVideos } = await adminClient.from("videos").select("*", { count: 'exact', head: true });
  const { count: totalAiTasks } = await adminClient.from("ai_api_logs").select("*", { count: 'exact', head: true });
  const { count: flashcardsCount } = await adminClient.from("flashcards").select("*", { count: 'exact', head: true });
  const { count: vocabCount } = await adminClient.from("vocabularies").select("*", { count: 'exact', head: true });

  const metrics = {
    totalUsers: users || 0,
    activeSubs: activeSubs || 0,
    totalVideos: totalVideos || 0,
    aiTasks: totalAiTasks || 0,
    flashcards: flashcardsCount || 0,
    vocab: vocabCount || 0,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Thống kê Sản phẩm
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Người dùng, Nội dung và Mức độ tương tác (Dữ liệu thực tế)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Tổng Người Dùng" value={metrics.totalUsers.toLocaleString("vi-VN")} icon={Users} color="text-emerald-400" />
        <MetricCard title="Gói Đăng Ký Active" value={metrics.activeSubs.toLocaleString("vi-VN")} icon={BarChart3} color="text-indigo-400" />
        <MetricCard title="Video Đã Xử Lý" value={metrics.totalVideos.toLocaleString("vi-VN")} icon={LineChart} color="text-purple-400" />
        <MetricCard title="Tổng Yêu Cầu AI" value={metrics.aiTasks.toLocaleString("vi-VN")} icon={BrainCircuit} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Engagement Metrics */}
        <div className="border border-neutral-800/60 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500"/> Mức Độ Tương Tác Của Người Dùng
            </h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-neutral-800/60 bg-neutral-900/20">
              <div className="text-sm text-neutral-400 mb-1">Tổng Số Từ Vựng</div>
              <div className="text-2xl font-semibold text-white">{metrics.vocab.toLocaleString("vi-VN")} từ</div>
            </div>
            <div className="p-4 rounded-xl border border-neutral-800/60 bg-neutral-900/20">
              <div className="text-sm text-neutral-400 mb-1">Tổng Số Flashcards</div>
              <div className="text-2xl font-semibold text-white">{metrics.flashcards.toLocaleString("vi-VN")} thẻ</div>
            </div>
            <div className="p-4 rounded-xl border border-neutral-800/60 bg-neutral-900/20">
              <div className="text-sm text-neutral-400 mb-1">Trung Bình Từ / User</div>
              <div className="text-2xl font-semibold text-white">{metrics.totalUsers > 0 ? Math.round(metrics.vocab / metrics.totalUsers) : 0} từ</div>
            </div>
            <div className="p-4 rounded-xl border border-neutral-800/60 bg-neutral-900/20">
              <div className="text-sm text-neutral-400 mb-1">Trung Bình Thẻ / User</div>
              <div className="text-2xl font-semibold text-white">{metrics.totalUsers > 0 ? Math.round(metrics.flashcards / metrics.totalUsers) : 0} thẻ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <div className="text-xs font-medium text-neutral-400">{title}</div>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
