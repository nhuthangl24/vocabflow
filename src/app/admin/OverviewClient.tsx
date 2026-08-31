"use client";

import { Users, Video, CreditCard, Activity, ArrowUpRight, CheckCircle2, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

export function OverviewClient({ initialStats }: { initialStats: any }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px] w-full mx-auto">
      
      {/* Vercel Header Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            VocabFlow <span className="text-neutral-500 font-normal">/</span> Production
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Hệ thống Quản trị Trung tâm</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/payments" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-neutral-200 transition-colors shadow-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Quản lý Đơn hàng
          </Link>
          <Link href="/admin/plans" className="px-4 py-2 bg-neutral-900 border border-neutral-700 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors shadow-sm">
            Gói cước
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Người Dùng (Active)" 
          value={initialStats?.activeUsers?.toString() || "0"} 
          trend="Đã đăng ký" 
          icon={<Users className="w-4 h-4 text-indigo-400" />}
        />
        <MetricCard 
          title="Video Đã Xử Lý" 
          value={initialStats?.totalVideos?.toString() || "0"} 
          trend="Hệ thống AI" 
          icon={<Video className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard 
          title="Doanh Thu" 
          value={`₫${(initialStats?.revenue || 0).toLocaleString("vi-VN")}`} 
          trend={`${initialStats?.totalOrders || 0} Đơn hàng`} 
          icon={<DollarSign className="w-4 h-4 text-amber-400" />}
        />
        <MetricCard 
          title="Hàng Đợi AI (Queue)" 
          value={initialStats?.pendingQueue?.toString() || "0"} 
          trend={initialStats?.pendingQueue > 0 ? "Đang xử lý" : "Trống"} 
          isWarning={initialStats?.pendingQueue > 10} 
          icon={<Activity className={`w-4 h-4 ${initialStats?.pendingQueue > 10 ? 'text-red-400' : 'text-blue-400'}`} />}
        />
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Trạng thái Hệ thống
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-neutral-800/60 bg-neutral-900/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Cơ sở dữ liệu (Supabase)</p>
                  <p className="text-lg font-semibold text-white">Hoạt động tốt</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                </div>
              </div>

              <div className="p-4 border border-neutral-800/60 bg-neutral-900/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Dịch vụ AI (Transcript)</p>
                  <p className="text-lg font-semibold text-white">Sẵn sàng</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-6 flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
          
          <h2 className="text-sm font-medium text-neutral-400 mb-6 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" /> Truy cập nhanh
          </h2>
          <div className="space-y-3 flex-1">
             <Link href="/admin/payments" className="block w-full p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 transition-all text-sm font-medium text-neutral-200">
               💰 Duyệt Đơn Hàng Thanh Toán
             </Link>
             <Link href="/admin/library" className="block w-full p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 transition-all text-sm font-medium text-neutral-200">
               📚 Quản lý Kho Video Công Khai
             </Link>
             <Link href="/admin/plans" className="block w-full p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 transition-all text-sm font-medium text-neutral-200">
               ⚙️ Chỉnh sửa Gói Cước & Giới Hạn
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon, isWarning }: { title: string, value: string, trend: string, icon?: React.ReactNode, isWarning?: boolean }) {
  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors group relative overflow-hidden">
      
      {/* Decorative gradient blob */}
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 ${isWarning ? 'bg-red-500' : 'bg-indigo-500'}`}></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <p className="text-sm text-neutral-400 font-medium">{title}</p>
        <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800/60">
          {icon}
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-3xl font-semibold text-white tracking-tight mb-2">{value}</h3>
        <p className={`text-xs font-medium flex items-center gap-1 ${isWarning ? 'text-red-400' : 'text-emerald-400'}`}>
          <ArrowUpRight className="w-3 h-3" /> {trend}
        </p>
      </div>
    </div>
  );
}
