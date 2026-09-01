"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, LayoutDashboard, Library, BookOpen, LineChart, Settings, Zap, Lock, Layers, Headphones, CreditCard } from "lucide-react";
import UserMenuClient from "./UserMenuClient";
import NotificationBell from "./NotificationBell";
import { PlanFeatures } from "@/lib/plans";

export default function MobileHeader({ user, planFeatures }: { user: any, planFeatures?: PlanFeatures }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const navItems = [
    { name: "Trang chủ", href: "/dashboard", icon: LayoutDashboard },
    { name: "Thống kê", href: user ? "/analytics" : "/login", icon: LineChart },
    { name: "Kho Video", href: user ? "/library" : "/login", icon: Library, locked: planFeatures && !planFeatures.enable_library },
    { name: "Kho Từ vựng", href: user ? "/vocabulary" : "/login", icon: BookOpen, locked: planFeatures && !planFeatures.enable_vocabulary },
    { name: "Flashcards", href: user ? "/flashcards" : "/login", icon: Layers, locked: planFeatures && !planFeatures.enable_flashcards },
    { name: "Shadowing", href: user ? "/shadowing" : "/login", icon: Headphones, locked: planFeatures && !planFeatures.enable_shadowing },
    { name: "Gói cước", href: user ? "/pricing" : "/login", icon: CreditCard },
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
        <div className="flex items-center gap-1">
          {user && <NotificationBell />}
          <button 
            onClick={() => setIsOpen(true)} 
            className="p-2 -mr-1 text-slate-600 hover:text-slate-900 transition-colors dark:text-white dark:text-neutral-300"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
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
                  href={item.locked ? "/pricing" : item.href}
                  onClick={() => setIsOpen(false)} 
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all ${ isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 active:bg-slate-50 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-900' }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </div>
                  {item.locked && (
                    <Lock className="w-4 h-4 text-neutral-400" />
                  )}
                </Link>
              );
            })}
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
