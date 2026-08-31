"use client";

import { Bell, Search, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminHeader({ user }: { user: any }) {
  return (
    <header className="h-14 border-b border-neutral-800/60 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-sm font-medium text-neutral-200">
          Command Center
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-neutral-400 hover:text-neutral-200 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full">
          Exit Admin <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </header>
  );
}
