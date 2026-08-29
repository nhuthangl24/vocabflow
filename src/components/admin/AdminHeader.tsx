"use client";

import { Activity, Bell } from "lucide-react";
import Image from "next/image";

export default function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-b border-neutral-800 bg-[#0a0a0a] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-neutral-400 hover:text-neutral-300 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Mở menu</span>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div className="h-6 w-px bg-neutral-800 md:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch md:gap-x-6 items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-medium tracking-tight px-4 text-neutral-400 font-mono">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Môi trường: <span className="text-white">Production</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 shrink-0 border-l border-neutral-800 pl-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Khu vực: <span className="text-white">sgp1</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 shrink-0 border-l border-neutral-800 pl-4">
            <Activity className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-white">Ổn định</span>
          </div>
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-neutral-500 hover:text-neutral-300 transition-colors">
            <span className="sr-only">Xem thông báo</span>
            <Bell className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-800" aria-hidden="true" />

          <div className="flex items-center gap-x-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="h-7 w-7 rounded-full bg-neutral-800"
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=111111"
              alt="Admin avatar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
