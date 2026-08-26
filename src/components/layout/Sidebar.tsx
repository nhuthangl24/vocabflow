import Link from "next/link";
import { Sparkles, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SidebarNav from "./SidebarNav";

export default async function Sidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 h-screen hidden md:flex">
      {/* Workspace / Logo */}
      <div className="h-14 flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group w-full">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center shadow-[0_2px_8px_rgb(79,70,229,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">Lumina Vocabulary</span>
        </Link>
      </div>

      <SidebarNav />

      {/* Upgrade CTA */}
      <div className="p-4">
        <div className="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-[13px] font-bold text-slate-900">Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mb-3">Unlock unlimited AI transcription & advanced vocabulary.</p>
          <Link href="/pricing" className="block w-full text-center px-3 py-1.5 bg-white border border-slate-200 text-[12px] font-bold text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors">
            View Plans
          </Link>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg cursor-pointer transition-colors -mx-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm border border-indigo-600/20">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-900 truncate">{user?.email?.split('@')[0] || "User"}</p>
            <p className="text-[11px] font-medium text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
