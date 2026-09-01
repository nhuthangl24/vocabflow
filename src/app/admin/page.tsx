import { createAdminClient } from "@/lib/supabase/admin";
import { 
  Activity, Users, Zap, DollarSign, Film, BrainCircuit, BookOpen, Clock, HeartPulse 
} from "lucide-react";
import Link from "next/link";
import { TelegramStatusWidget } from "./TelegramStatusWidget";

export default async function AdminOverviewPage() {
  const adminClient = createAdminClient();

  // Calculate today's boundaries
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Run all count queries in parallel for maximum performance
  const [
    { count: aiReqs },
    { count: jobs },
    { data: orders },
    { count: newUsers },
    { count: newVideos },
    { count: shadowing },
    { count: vocab },
    { count: grammar },
    { count: pendingTasks },
    { count: failedTasks }
  ] = await Promise.all([
    adminClient.from("ai_api_logs").select("*", { count: 'exact', head: true }).gte('created_at', startOfDay),
    adminClient.from("transcript_jobs").select("*", { count: 'exact', head: true }).gte('created_at', startOfDay),
    adminClient.from("orders").select("amount").eq("status", "PAID").gte('created_at', startOfDay),
    adminClient.from("users").select("*", { count: 'exact', head: true }).gte('created_at', startOfDay),
    adminClient.from("media_assets").select("*", { count: 'exact', head: true }).gte('created_at', startOfDay),
    adminClient.from("shadowing_progress").select("*", { count: 'exact', head: true }).gte('created_at', startOfDay),
    adminClient.from("vocabulary_items").select("*", { count: 'exact', head: true }).gte('created_at', startOfDay),
    adminClient.from("grammar_items").select("*", { count: 'exact', head: true }).gte('created_at', startOfDay),
    adminClient.from("tasks").select("*", { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient.from("tasks").select("*", { count: 'exact', head: true }).eq('status', 'failed'),
    adminClient.from("ai_api_logs").select("cost").gte('created_at', startOfDay),
    adminClient.from("system_services").select("*").order('type', { ascending: true })
  ]);

  const todayRevenue = orders?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  
  // Real Cost Calculation
  const aiLogsData = await adminClient.from("ai_api_logs").select("cost").gte('created_at', startOfDay);
  const todayCost = aiLogsData.data?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0;

  // Real System Services
  const { data: services } = await adminClient.from("system_services").select("*").order('type', { ascending: true });
  const dbService = services?.find(s => s.name.toLowerCase().includes('database') || s.type === 'database');
  const appService = services?.find(s => s.name.toLowerCase().includes('app') || s.type === 'backend');
  const storageService = services?.find(s => s.name.toLowerCase().includes('storage') || s.type === 'storage');
  const edgeService = services?.find(s => s.name.toLowerCase().includes('edge') || s.type === 'webhook');

  const kiraProvider = services?.find(s => s.name.toLowerCase().includes('kira') || s.type === 'ai_provider');
  const hhtechProvider = services?.find(s => s.name.toLowerCase().includes('hhtech') || s.type === 'ai_provider');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white tracking-tight">Tổng Quan Hệ Thống</h2>
          <p className="text-sm text-neutral-400 mt-1">Dữ liệu thời gian thực và hiệu suất trong ngày (Dữ liệu thật 100%)</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">Hệ Thống Ổn Định</span>
        </div>
      </div>

      {/* TIER 1: FINANCIAL & COMPUTE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Yêu Cầu AI Hôm Nay" value={aiReqs || 0} icon={Zap} />
        <MetricCard title="Tiến Trình Hôm Nay" value={jobs || 0} icon={Activity} />
        <MetricCard title="Doanh Thu Hôm Nay" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(todayRevenue)} icon={DollarSign} isCurrency />
        <MetricCard title="Chi Phí AI Ước Tính" value={`$${todayCost.toFixed(2)}`} icon={Clock} isCost />
      </div>

      {/* TIER 2: USERS & CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Người Dùng Mới" value={newUsers || 0} icon={Users} />
        <MetricCard title="Video Mới" value={newVideos || 0} icon={Film} />
        <MetricCard title="Lượt Bóng Âm" value={shadowing || 0} icon={BrainCircuit} />
        <MetricCard title="Từ Vựng/Ngữ Pháp" value={(vocab || 0) + (grammar || 0)} icon={BookOpen} />
      </div>

      {/* TIER 3: HEALTH STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* System Health */}
        <div className="col-span-1 border border-neutral-800/60 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2"><HeartPulse className="w-4 h-4 text-emerald-500"/> Trạng Thái Nền Tảng</h3>
          </div>
          <div className="p-5 space-y-4">
            <HealthItem label="Database (PostgreSQL)" status={dbService?.status === 'operational' ? "Bình thường" : "Cảnh báo"} isWarning={dbService?.status !== 'operational'} isNeutral={dbService?.status === 'operational'} />
            <HealthItem label="Next.js App Server" status={appService?.status === 'operational' ? "Bình thường" : "Cảnh báo"} isWarning={appService?.status !== 'operational'} isNeutral={appService?.status === 'operational'} />
            <HealthItem label="Supabase Storage" status={storageService?.status === 'operational' ? "Bình thường" : "Cảnh báo"} isWarning={storageService?.status !== 'operational'} isNeutral={storageService?.status === 'operational'} />
            <HealthItem label="Edge Functions" status={edgeService?.status === 'operational' ? "Bình thường" : "Cảnh báo"} isWarning={edgeService?.status !== 'operational'} isNeutral={edgeService?.status === 'operational'} />
          </div>
        </div>

        {/* Telegram Notifications */}
        <TelegramStatusWidget 
          isConnected={!!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID}
          chatId={process.env.TELEGRAM_CHAT_ID || null}
        />

        {/* AI Providers Status */}
        <div className="col-span-1 border border-neutral-800/60 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500"/> Trạng Thái Hàng Đợi (Queue)</h3>
            <Link href="/admin/queue" className="text-xs text-indigo-400 hover:text-indigo-300">Xem Chi Tiết →</Link>
          </div>
          <div className="p-5 space-y-4">
            <HealthItem label="Task Đang Chờ" status="Đang xử lý" value={`${pendingTasks || 0} Pending`} isNeutral />
            <HealthItem label="Task Lỗi (Dead Letter)" status={failedTasks && failedTasks > 0 ? "Cảnh báo" : "Bình thường"} value={`${failedTasks || 0} Failed`} isWarning={failedTasks && failedTasks > 0} />
          </div>
        </div>

        {/* Provider Health */}
        <div className="col-span-1 border border-neutral-800/60 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-xl shadow-black/40">
          <div className="px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-500"/> Trạng Thái Provider</h3>
            <Link href="/admin/providers" className="text-xs text-indigo-400 hover:text-indigo-300">Phân Tích →</Link>
          </div>
          <div className="p-5 space-y-4">
            <HealthItem label="KiraAI Engine" status={kiraProvider?.status === 'operational' ? "Bình thường" : "Cảnh báo"} isWarning={kiraProvider?.status !== 'operational'} isNeutral={kiraProvider?.status === 'operational'} />
            <HealthItem label="HHTECH API" status={hhtechProvider?.status === 'operational' ? "Bình thường" : "Cảnh báo"} isWarning={hhtechProvider?.status !== 'operational'} isNeutral={hhtechProvider?.status === 'operational'} />
          </div>
        </div>

      </div>
    </div>
  );
}

// Subcomponents
function MetricCard({ title, value, icon: Icon, trend, isCurrency, isCost }: any) {
  return (
    <div className="p-5 rounded-xl border border-neutral-800/60 bg-gradient-to-b from-neutral-900/60 to-neutral-900/20 relative overflow-hidden group hover:border-neutral-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{title}</div>
        <Icon className={`w-4 h-4 ${isCost ? 'text-red-400' : isCurrency ? 'text-emerald-400' : 'text-indigo-400'}`} />
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-semibold text-white tracking-tight">{value}</div>
        {trend && (
          <div className={`text-xs font-medium ${trend.startsWith('+') && !isCost ? 'text-emerald-400' : 'text-neutral-500'}`}>
            {trend}
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function HealthItem({ label, status, latency, value, isWarning, isNeutral }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isWarning ? 'bg-amber-500' : isNeutral ? 'bg-neutral-600' : 'bg-emerald-500'}`} />
        <span className="text-sm text-neutral-300">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${isWarning ? 'text-amber-400' : isNeutral ? 'text-neutral-500' : 'text-emerald-400'}`}>{status}</span>
        {(latency || value) && (
          <span className="text-xs text-neutral-500 tabular-nums font-mono w-16 text-right">
            {latency || value}
          </span>
        )}
      </div>
    </div>
  );
}
