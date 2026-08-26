"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, LineChart, Settings } from "lucide-react";

export default function SidebarNav() {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Library", href: "/library", icon: Library },
    { name: "Analytics", href: "/analytics", icon: LineChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2">Menu</div>
      
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name} 
            href={item.href} 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-[13px] transition-colors ${
              isActive 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
