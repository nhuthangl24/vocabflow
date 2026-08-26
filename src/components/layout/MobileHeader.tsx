"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, LayoutDashboard, Library, LineChart, Settings, Zap } from "lucide-react";

export default function MobileHeader({ userEmail }: { userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Library", href: "/library", icon: Library },
    { name: "Analytics", href: "/analytics", icon: LineChart },
    { name: "Settings", href: "/settings", icon: Settings },
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
      <div className="md:hidden flex items-center justify-between h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sticky top-0 z-40 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center shadow-[0_2px_8px_rgb(79,70,229,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">Lumina</span>
        </Link>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 -mr-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      {/* Fullscreen Overlay Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
              <span className="font-bold text-slate-900">Menu</span>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
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
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 active:bg-slate-50 hover:bg-slate-50'
                    }`}
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
                  <span className="text-sm font-bold text-slate-900">Upgrade to Pro</span>
                </div>
                <p className="text-[12px] text-slate-600 font-medium mb-4 leading-relaxed">
                  Unlock unlimited AI translation & advanced vocabulary tools.
                </p>
                <Link 
                  onClick={() => setIsOpen(false)} 
                  href="/pricing" 
                  className="flex items-center justify-center w-full px-4 py-2.5 bg-white border border-amber-200 text-sm font-bold text-amber-700 rounded-xl shadow-sm hover:bg-amber-50 transition-colors"
                >
                  View Plans
                </Link>
              </div>
            </div>

            {/* Profile */}
            <div className="p-4 border-t border-slate-100 shrink-0 mb-safe">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm border border-indigo-600/20">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-900 truncate">{userEmail.split('@')[0]}</p>
                  <p className="text-[12px] font-medium text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
