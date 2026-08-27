"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Clapperboard, LogOut } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const routes = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Media & Jobs", path: "/admin/media", icon: Clapperboard },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 hidden md:flex flex-col flex-shrink-0 h-full shadow-xl">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <Link href="/admin" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-indigo-400 transition-colors shadow-sm shadow-indigo-500/20">
            A
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Admin<span className="text-indigo-400">Flow</span></span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</div>
        {routes.map((route) => {
          const isActive = pathname === route.path || pathname.startsWith(`${route.path}/`);
          const Icon = route.icon;
          return (
            <Link
              key={route.path}
              href={route.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                  : "hover:bg-slate-800 hover:text-white border border-transparent"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
              {route.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <Link 
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Exit Admin
        </Link>
      </div>
    </div>
  );
}
