"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Zap, ChevronLeft, ChevronRight } from "lucide-react";

import SidebarNav from "./SidebarNav";
import UserMenuClient from "./UserMenuClient";
import LuminaLogo from "../LuminaLogo";

import { PlanFeatures } from "@/lib/plans";

type SidebarClientProps = {
  user: any;
  planFeatures?: PlanFeatures;
};

export default function SidebarClient({ user, planFeatures }: SidebarClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside 
      className={`relative transition-all duration-300 ease-in-out flex flex-col shrink-0 h-screen hidden md:flex border-r border-[#EAE4D9] dark:border-neutral-800 ${
        isCollapsed ? "w-20" : "w-64"
      } bg-[#F3EFE6] dark:bg-[#0a0a0a] shadow-[2px_0_10px_rgba(0,0,0,0.02)]`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-16 w-6 h-6 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-full flex items-center justify-center text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm z-10 transition-transform duration-300 hover:scale-110"
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Workspace / Logo */}
      <div className={`h-14 flex items-center shrink-0 mt-2 ${isCollapsed ? 'justify-center' : 'pl-7'}`}>
          <Link href="/dashboard" className={`flex items-center relative ${isCollapsed ? 'w-12 h-12 justify-center mx-auto' : ''}`}>
            <span className={`text-xl font-black text-slate-900 dark:text-white tracking-tighter transition-all duration-300 absolute inset-0 flex items-center justify-center ${isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              L
            </span>
            <span className={`text-xl font-black text-slate-900 dark:text-white tracking-tighter whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
              LUMINA
            </span>
          </Link>
        </div>

      <SidebarNav isCollapsed={isCollapsed} user={user} planFeatures={planFeatures} />

        {/* Filler to push User Profile down */}
        <div className="mt-auto"></div>

        {/* User Profile */}
      <div className={`p-3 shrink-0 relative ${isCollapsed ? 'mb-2' : ''}`}>
        <UserMenuClient user={user} isCollapsed={isCollapsed} planFeatures={planFeatures} />
      </div>
    </aside>
  );
}

// force rebuild 4

// force rebuild 5

// force rebuild 9

// force rebuild 10

// force rebuild 14
