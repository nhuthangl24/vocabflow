"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { 
  Search, Users, Activity, CreditCard, Film, 
  TerminalSquare, Server, Settings, Database, Zap
} from "lucide-react";

export default function CommandPalette({ 
  open, 
  setOpen 
}: { 
  open: boolean; 
  setOpen: (open: boolean) => void 
}) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className="w-full max-w-lg bg-[#111111] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <Command label="Global Command Menu" className="w-full h-full flex flex-col">
          <div className="flex items-center px-4 py-3 border-b border-neutral-800/60">
            <Search className="w-5 h-5 text-neutral-500 mr-2" />
            <Command.Input 
              placeholder="Search users, jobs, pages or commands..." 
              className="flex-1 bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
              autoFocus
            />
            <kbd className="font-sans text-[10px] px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400">ESC</kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
            <Command.Empty className="py-6 text-center text-sm text-neutral-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs text-neutral-500 font-medium px-2 py-1.5 mb-1">
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/admin"))}
                className="flex items-center gap-2 px-2 py-2 text-sm text-neutral-200 rounded-md aria-selected:bg-indigo-500/10 aria-selected:text-indigo-400 cursor-pointer"
              >
                <Activity className="w-4 h-4" /> Overview Dashboard
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/admin/users"))}
                className="flex items-center gap-2 px-2 py-2 text-sm text-neutral-200 rounded-md aria-selected:bg-indigo-500/10 aria-selected:text-indigo-400 cursor-pointer"
              >
                <Users className="w-4 h-4" /> Manage Users
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/admin/payments"))}
                className="flex items-center gap-2 px-2 py-2 text-sm text-neutral-200 rounded-md aria-selected:bg-indigo-500/10 aria-selected:text-indigo-400 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" /> Billing & Payments
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/admin/providers"))}
                className="flex items-center gap-2 px-2 py-2 text-sm text-neutral-200 rounded-md aria-selected:bg-indigo-500/10 aria-selected:text-indigo-400 cursor-pointer"
              >
                <Zap className="w-4 h-4" /> AI Providers Health
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Quick Actions" className="text-xs text-neutral-500 font-medium px-2 py-1.5 mt-2 mb-1">
              <Command.Item 
                onSelect={() => runCommand(() => console.log("Refresh cache"))}
                className="flex items-center gap-2 px-2 py-2 text-sm text-neutral-200 rounded-md aria-selected:bg-neutral-800 cursor-pointer"
              >
                <Server className="w-4 h-4" /> Flush Redis Cache
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/admin/settings"))}
                className="flex items-center gap-2 px-2 py-2 text-sm text-neutral-200 rounded-md aria-selected:bg-neutral-800 cursor-pointer"
              >
                <Settings className="w-4 h-4" /> System Settings
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
      
      {/* Invisible backdrop to catch clicks outside */}
      <div className="absolute inset-0 z-[-1]" onClick={() => setOpen(false)} />
    </div>
  );
}
