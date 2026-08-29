"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Clapperboard, LogOut, CreditCard, X, Library, 
  LineChart, Search, Activity, Cpu, Bell, ShieldAlert
} from "lucide-react";

export default function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const routes = [
    { name: "Tổng quan", path: "/admin", icon: LayoutDashboard },
    { name: "Tiến trình (Tasks)", path: "/admin/tasks", icon: Activity },
    { name: "Nhà cung cấp AI", path: "/admin/providers", icon: Cpu },
    { name: "Logs Thời gian thực", path: "/admin/logs", icon: Search },
    { name: "Phân tích (Analytics)", path: "/admin/analytics", icon: LineChart },
    { name: "Uptime Center", path: "/admin/uptime", icon: ShieldAlert },
    { name: "Người dùng (CRM)", path: "/admin/users", icon: Users },
    { name: "Quản lý Media", path: "/admin/media", icon: Clapperboard },
    { name: "Chi phí AI", path: "/admin/costs", icon: CreditCard },
    { name: "Cảnh báo (Alerts)", path: "/admin/alerts", icon: Bell },
  ];

  return (
    <div className="w-60 bg-[#000000] text-neutral-400 flex flex-col flex-shrink-0 h-full border-r border-neutral-800/50">
      <div className="h-14 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2 group" onClick={onClose}>
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-black font-bold group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/></svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-200">AI Control Center</span>
        </Link>
        <button onClick={onClose} className="md:hidden text-neutral-500 hover:text-neutral-200 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Global Search Trigger */}
      <div className="px-3 py-2">
        <button 
          className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-neutral-800/80 rounded hover:bg-[#1a1a1a] transition-colors text-xs text-neutral-500"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          }}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Tìm kiếm...</span>
          <div className="ml-auto flex items-center gap-0.5">
            <kbd className="font-sans px-1 py-0.5 bg-neutral-900 rounded text-[10px]">⌘</kbd>
            <kbd className="font-sans px-1 py-0.5 bg-neutral-900 rounded text-[10px]">K</kbd>
          </div>
        </button>
      </div>
      
      <div className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto scrollbar-none">
        <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-2 px-2">Vận hành</div>
        {routes.map((route) => {
          const isActive = pathname === route.path || (route.path !== '/admin' && pathname.startsWith(`${route.path}/`));
          const Icon = route.icon;
          return (
            <Link
              key={route.path}
              href={route.path}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium transition-colors ${
                isActive 
                  ? "bg-neutral-900 text-white" 
                  : "text-neutral-500 hover:bg-neutral-900/50 hover:text-neutral-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
              {route.name}
            </Link>
          );
        })}
      </div>

      <div className="p-2 border-t border-neutral-900">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Thoát Admin
        </Link>
      </div>
    </div>
  );
}
