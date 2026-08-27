"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import SidebarNav from "./SidebarNav";
import UserMenuClient from "./UserMenuClient";

type SidebarClientProps = {
  user: any;
};

export default function SidebarClient({ user }: SidebarClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside 
      className={`relative transition-all duration-300 ease-in-out flex flex-col shrink-0 h-screen hidden md:flex border-r border-[#EAE4D9] dark:border-neutral-800 ${
        isCollapsed ? "w-20" : "w-64"
      } bg-[#F3EFE6] dark:bg-[#0a0a0a] shadow-[2px_0_10px_rgba(0,0,0,0.02)]`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-16 w-6 h-6 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-full flex items-center justify-center text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm z-10 transition-transform hover:scale-110"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Workspace / Logo */}
      <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} shrink-0 mt-2`}>
        <Link href="/dashboard" className={`flex items-center gap-2.5 group ${isCollapsed ? 'w-auto' : 'w-full px-2'}`}>
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center shadow-[0_2px_8px_rgb(79,70,229,0.3)] shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Lumina</span>
          )}
        </Link>
      </div>

      <SidebarNav isCollapsed={isCollapsed} user={user} />

      {/* Upgrade CTA */}
      {!isCollapsed ? (
        <div className="px-4 py-2 mt-auto">
          <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">Nâng cấp gói Pro</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mb-2 leading-tight dark:text-neutral-400">Mở khóa tính năng dịch AI & từ vựng nâng cao không giới hạn.</p>
            <Link href="/pricing" className="block w-full text-center px-3 py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-[11px] font-bold text-slate-700 dark:text-neutral-300 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors dark:text-neutral-200">
              Xem bảng giá
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-auto px-2 py-4 flex justify-center">
          <Link href="/pricing" className="w-10 h-10 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-neutral-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors" title="Nâng cấp gói Pro">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          </Link>
        </div>
      )}

      {/* User Profile */}
      <div className={`p-3 shrink-0 relative ${isCollapsed ? 'mb-2' : ''}`}>
        <UserMenuClient user={user} isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
