"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, BookOpen, LineChart, Settings } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

type SidebarNavProps = {
  isCollapsed?: boolean;
  user?: any;
};

export default function SidebarNav({ isCollapsed, user }: SidebarNavProps) {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Trang chủ", href: "/dashboard", icon: LayoutDashboard },
    { name: "Thống kê", href: user ? "/analytics" : "/login", icon: LineChart },
    { name: "Kho Video", href: user ? "/library" : "/login", icon: Library },
    { name: "Kho Từ vựng", href: user ? "/vocabulary" : "/login", icon: BookOpen },
    { name: "Cài đặt", href: user ? "/settings" : "/login", icon: Settings },
  ];

  return (
    <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'} flex flex-col gap-1`}>
      {!isCollapsed && (
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2 dark:text-neutral-400">Danh mục</div>
      )}
      
      {navItems.map((item) => {
        // Active state based on original path if user was logged in
        const originalPath = item.href === '/login' 
          ? (item.name === "Kho Video" ? "/library" : item.name === "Kho Từ vựng" ? "/vocabulary" : item.name === "Thống kê" ? "/analytics" : "/settings")
          : item.href;
          
        const isActive = pathname === originalPath || pathname.startsWith(originalPath + '/');
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name} 
            href={item.href} 
            title={isCollapsed ? item.name : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center p-2.5 mx-auto w-12 h-12' : 'gap-3 px-3 py-2'} rounded-xl font-semibold text-[13px] transition-colors ${ isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800' }`}
          >
            <Icon className={isCollapsed ? "w-5 h-5" : "w-4 h-4"} />
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-center dark:border-neutral-800">
        <ThemeToggle />
      </div>
    </div>
  );
}
