"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../ThemeToggle";
import { LayoutDashboard, Library, BookOpen, LineChart, Settings, Headphones, Activity, Zap, History, Layers, CreditCard, Lock } from "lucide-react";
import { PlanFeatures } from "@/lib/plans";

type SidebarNavProps = {
  isCollapsed?: boolean;
  user?: any;
  planFeatures?: PlanFeatures;
};

export default function SidebarNav({ isCollapsed, user, planFeatures }: SidebarNavProps) {
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

  return (
    <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'} flex flex-col gap-1`}>
      {!isCollapsed && (
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2 dark:text-neutral-400">Danh mục</div>
      )}
      
      {navItems.map((item) => {
        // Active state based on original path if user was logged in
        let originalPath = item.href;
        if (item.href === '/login') {
            const match = ['Kho Video', 'Kho Từ vựng', 'Thống kê', 'Shadowing', 'Cài đặt', 'Processing', 'AI Usage', 'Activity', 'Flashcards', 'Gói cước'].find(n => n === item.name);
            if (match) {
                const map: Record<string, string> = {
                    'Kho Video': '/library', 'Kho Từ vựng': '/vocabulary', 'Thống kê': '/analytics', 'Shadowing': '/shadowing', 'Cài đặt': '/settings',
                    'Processing': '/processing', 'AI Usage': '/ai-usage', 'Activity': '/activity', 'Flashcards': '/flashcards', 'Gói cước': '/pricing'
                };
                originalPath = map[match];
            }
        }
          
        const isActive = pathname === originalPath || pathname.startsWith(originalPath + '/');
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name} 
            href={item.locked ? "/pricing" : item.href} 
            title={isCollapsed ? item.name : undefined}
            className={`flex items-center justify-between ${isCollapsed ? 'p-2.5 mx-auto w-12 h-12' : 'px-3 py-2'} rounded-xl font-semibold text-[13px] transition-colors ${ isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800' }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={isCollapsed ? "w-5 h-5" : "w-4 h-4"} />
              {!isCollapsed && <span>{item.name}</span>}
            </div>
            {!isCollapsed && item.locked && (
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-center dark:border-neutral-800">
        <ThemeToggle isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}

// force rebuild 2
