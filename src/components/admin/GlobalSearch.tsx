"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, User, FileVideo, Activity, Cpu, LayoutDashboard, Users, Settings, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-[#111] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <Command label="Global Search" onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}>
          <div className="flex items-center gap-2 mb-2 px-4 py-2">
            <Search className="w-5 h-5 text-neutral-400" />
            <Command.Input
              autoFocus
              placeholder="Tìm kiếm logs, người dùng, báo cáo..."
              className="flex-1 bg-transparent text-white placeholder-neutral-500 border-none focus:ring-0 text-sm py-3 outline-none"
            />
            <kbd className="font-sans px-1.5 py-0.5 bg-neutral-800 rounded text-[10px] text-neutral-500">ESC</kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto scrollbar-none pb-2">
            <Command.Empty className="py-6 text-center text-sm text-neutral-500">
              Không tìm thấy kết quả nào.
            </Command.Empty>

            <Command.Group heading="Điều hướng nhanh" className="text-[10px] uppercase tracking-widest text-neutral-500 px-4 py-1 mb-1 font-bold">
              <Command.Item
                onSelect={() => handleSelect("/admin")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-neutral-400" />
                Tổng quan Dashboard
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/users")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-neutral-400" />
                Quản lý người dùng
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Giám sát & Log" className="text-[10px] uppercase tracking-widest text-neutral-500 px-4 pt-3 pb-1 mb-1 font-bold">
              <Command.Item
                onSelect={() => handleSelect("/admin/logs")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
              >
                <Activity className="w-4 h-4 text-neutral-400" />
                Logs Thời gian thực
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/providers")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-neutral-400" />
                Theo dõi API AI
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/alerts")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-500" />
                Trung tâm Cảnh báo
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
