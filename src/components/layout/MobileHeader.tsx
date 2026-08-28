"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, LayoutDashboard, Library, BookOpen, LineChart, Settings, Zap } from "lucide-react";
import UserMenuClient from "./UserMenuClient";

export default function MobileHeader({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const navItems = [
    { name: "Trang chủ", href: "/dashboard", icon: LayoutDashboard },
    { name: "Thống kê", href: user ? "/analytics" : "/login", icon: LineChart },
    { name: "Kho Video", href: user ? "/library" : "/login", icon: Library },
    { name: "Kho Từ vựng", href: user ? "/vocabulary" : "/login", icon: BookOpen },
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
        <Link href="/dashboard" className="flex items-center">
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">LUMINA</span>
        </Link>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 -mr-2 text-slate-600 hover:text-slate-900 transition-colors dark:text-white dark:text-neutral-300"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      {/* Fullscreen Overlay Menu */}
      <div className={`md:hidden fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" 
          onClick={() => setIsOpen(false)} 
        />
        <div className={`relative w-72 bg-white h-full flex flex-col shadow-2xl transition-transform duration-300 ease-out dark:bg-[#0a0a0a] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 shrink-0 dark:border-neutral-800">
            <span className="font-bold text-slate-900 dark:text-white">Danh mục</span>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full dark:text-white dark:text-neutral-400 dark:bg-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 mt-2">
            {navItems.map((item) => {
              const originalPath = item.href === '/login' 
                ? (item.name === "Kho Video" ? "/library" : item.name === "Kho Từ vựng" ? "/vocabulary" : item.name === "Thống kê" ? "/analytics" : "/settings")
                : item.href;
              const isActive = pathname === originalPath || pathname.startsWith(originalPath + '/');
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsOpen(false)} 
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all ${ isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 active:bg-slate-50 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-900' }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
            
            {/* Upgrade CTA */}
            <div className="p-4 shrink-0">
              {user?.user_metadata?.plan === 'pro' ? (
                <div className="bg-gradient-to-b from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 fill-indigo-500 dark:fill-indigo-400" />
                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Gói Pro Kích Hoạt</span>
                  </div>
                  <p className="text-xs text-indigo-700/80 font-medium mb-3 leading-relaxed dark:text-indigo-200/80">Bạn đang sở hữu mọi tính năng AI cao cấp nhất.</p>
                  <Link href="/pricing" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-2.5 bg-white dark:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/30 text-xs font-bold text-indigo-700 dark:text-indigo-100 rounded-lg shadow-sm active:bg-indigo-50 dark:active:bg-indigo-500/30 transition-colors">
                    Xem chi tiết
                  </Link>
                </div>
              ) : user?.user_metadata?.plan === 'basic' ? (
                <div className="bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400 fill-emerald-500 dark:fill-emerald-400" />
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Gói Basic Kích Hoạt</span>
                  </div>
                  <p className="text-xs text-emerald-700/80 font-medium mb-3 leading-relaxed dark:text-emerald-200/80">Nâng cấp Pro để mở khóa không giới hạn.</p>
                  <Link href="/pricing" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-2.5 bg-white dark:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-100 rounded-lg shadow-sm active:bg-emerald-50 dark:active:bg-emerald-500/30 transition-colors">
                    Nâng cấp Pro
                  </Link>
                </div>
              ) : (
                <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 border border-amber-200/50 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-amber-900">Nâng cấp tài khoản</span>
                  </div>
                  <p className="text-xs text-amber-700/80 font-medium mb-4 leading-relaxed">Mở khóa tính năng dịch AI và lưu từ vựng không giới hạn.</p>
                  <Link href="/pricing" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-2.5 bg-white border border-amber-200 text-xs font-bold text-amber-700 rounded-xl shadow-sm active:bg-amber-50 transition-colors">
                    Xem bảng giá
                  </Link>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="p-4 border-t border-slate-100 shrink-0 mb-safe dark:border-neutral-800">
              <UserMenuClient user={user} />
            </div>
          </div>
        </div>
    </>
  );
}
