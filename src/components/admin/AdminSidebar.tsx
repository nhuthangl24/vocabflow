"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, LineChart, Activity, 
  Zap, Server, ListTree, 
  Users, CreditCard, Receipt, DollarSign,
  Film, Headphones, Type, StickyNote, BrainCircuit, Flag,
  TerminalSquare, HeartPulse, Bell, ToggleRight, Settings, Search, CheckSquare, Database
} from "lucide-react";
import { useEffect, useState } from "react";

const NAV_GROUPS = [
  {
    label: "Cốt lõi",
    items: [
      { name: "Tổng quan", href: "/admin", icon: LayoutDashboard },
      { name: "Phân tích", href: "/admin/analytics", icon: LineChart },
      { name: "Thời gian thực", href: "/admin/realtime", icon: Activity },
    ]
  },
  {
    label: "Công cụ AI",
    items: [
      { name: "Nhà cung cấp AI", href: "/admin/providers", icon: Zap },
      { name: "System Status", href: "/admin/status", icon: Activity },
      { name: "Database", href: "/admin/database", icon: Database },
      { name: "Workers", href: "/admin/workers", icon: Server },
      { name: "Hàng đợi xử lý", href: "/admin/queue", icon: ListTree },
    ]
  },
  {
    label: "Người dùng & Tài chính",
    items: [
      { name: "Người dùng", href: "/admin/users", icon: Users },
      { name: "Trung tâm Thông báo", href: "/admin/notifications", icon: Bell },
      { name: "Quản lý Plans", href: "/admin/plans", icon: CreditCard },
      { name: "Gói đăng ký", href: "/admin/subscriptions", icon: CreditCard },
      { name: "Thanh toán", href: "/admin/payments", icon: Receipt },
      { name: "Mã giảm giá (Vouchers)", href: "/admin/vouchers", icon: Receipt },
      { name: "Chi phí AI", href: "/admin/cost", icon: DollarSign },
    ]
  },
  {
    label: "Công cụ Nội dung",
    items: [
      { name: "Thư viện Media", href: "/admin/library", icon: Film },
      { name: "Báo lỗi Phụ đề", href: "/admin/reports", icon: Flag },
      { name: "Bóng âm", href: "/admin/shadowing", icon: Headphones },
      { name: "Từ vựng", href: "/admin/vocabulary", icon: Type },
      { name: "Ngữ pháp", href: "/admin/grammar", icon: StickyNote },
      { name: "SRS & Flashcards", href: "/admin/srs", icon: BrainCircuit },
    ]
  },
  {
    label: "Hệ thống",
    items: [
      { name: "Nhật ký (Logs)", href: "/admin/logs", icon: TerminalSquare },
      { name: "Giám sát", href: "/admin/monitoring", icon: HeartPulse },
      { name: "Cảnh báo", href: "/admin/alerts", icon: Bell },
      { name: "Cờ tính năng", href: "/admin/flags", icon: ToggleRight },
      { name: "Cài đặt Hệ thống", href: "/admin/settings", icon: Settings },
    ]
  }
];

export default function AdminSidebar({ user, onOpenCommandPalette }: { user: any, onOpenCommandPalette?: () => void }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full border-r border-neutral-800/60 bg-[#0a0a0a] flex flex-col h-full shrink-0">
      <div className="h-14 flex items-center px-4 border-b border-neutral-800/60">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-neutral-200 tracking-wide text-sm">LUMINA <span className="text-neutral-500 font-medium">CORP</span></span>
        </Link>
      </div>
      
      <div className="px-3 py-3">
        <button 
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-colors shadow-sm"
        >
          <span className="flex items-center gap-2"><Search className="w-4 h-4"/> Search...</span>
          <kbd className="font-sans text-[10px] px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-400 shadow-sm">⌘K</kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-hide">
        {NAV_GROUPS.map((group, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = mounted && (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin'));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors group ${
                      isActive 
                        ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-neutral-800/60 bg-neutral-950/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-300 shadow-sm">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-neutral-200 truncate">{user?.email}</div>
            <div className="text-xs text-neutral-500 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> System Admin
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
