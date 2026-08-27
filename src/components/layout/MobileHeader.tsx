"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, LayoutDashboard, Library, LineChart, Settings, Zap } from "lucide-react";
import UserMenuClient from "./UserMenuClient";

export default function MobileHeader({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const navItems = [
    { name: "Trang chủ", href: "/dashboard", icon: LayoutDashboard },
    { name: "Thư viện", href: user ? "/library" : "/login", icon: Library },
    { name: "Thống kê", href: user ? "/analytics" : "/login", icon: LineChart },
    { name: "Cài đặt", href: user ? "/settings" : "/login", icon: Settings },
  ];

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  return (
    <>
      {/* Top bar - Mobile Only */}
      <div className="md:hidden flex items-center justify-between h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sticky top-0 z-40 shrink-0 dark:bg-[#0a0a0a] dark:border-neutral-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center shadow-[0_2px_8px_rgb(79,70,229,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight dark:text-white">Lumina</span>
        </Link>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 -mr-2 text-slate-600 hover:text-slate-900 transition-colors dark:text-white dark:text-neutral-300"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      {/* Fullscreen Overlay Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex justify-end">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 dark:bg-[#0a0a0a]">
            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 shrink-0 dark:border-neutral-800">
              <span className="font-bold text-slate-900 dark:text-white">Danh mục</span>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full dark:text-white dark:text-neutral-400 dark:bg-[#0a0a0a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 mt-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setIsOpen(false)} 
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all ${ isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 active:bg-slate-50 hover:bg-slate-50' }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            
            {/* Upgrade CTA */}
            <div className="p-4 shrink-0">
              <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 border border-amber-200/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Nâng cấp gói Pro</span>
                </div>
                <p className="text-[12px] text-slate-600 font-medium mb-4 leading-relaxed dark:text-neutral-300">
                  Mở khóa tính năng dịch AI & từ vựng nâng cao không giới hạn.
                </p>
                <Link 
                  onClick={() => setIsOpen(false)} 
                  href="/pricing" 
                  className="flex items-center justify-center w-full px-4 py-2.5 bg-white border border-amber-200 text-sm font-bold text-amber-700 rounded-xl shadow-sm hover:bg-amber-50 transition-colors dark:bg-[#0a0a0a]"
                >
                  Xem bảng giá
                </Link>
              </div>
            </div>

            {/* Profile */}
            <div className="p-4 border-t border-slate-100 shrink-0 mb-safe dark:border-neutral-800">
              <UserMenuClient user={user} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
