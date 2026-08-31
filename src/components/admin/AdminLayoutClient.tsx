"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import CommandPalette from "./CommandPalette";

export default function AdminLayoutClient({ 
  children, 
  user 
}: { 
  children: React.ReactNode; 
  user: any;
}) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <>
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
      
      <div className="flex h-screen bg-[#0a0a0a] text-neutral-200 font-sans overflow-hidden selection:bg-indigo-500/30">
        <div className="w-[260px] flex-shrink-0 border-r border-neutral-800/60 bg-neutral-950 z-10">
          <AdminSidebar user={user} onOpenCommandPalette={() => setCmdOpen(true)} />
        </div>
        
        <div className="flex flex-col flex-1 relative min-w-0 bg-[#0a0a0a] z-0 h-screen">
          <AdminHeader user={user} />
          <main className="flex-1 overflow-y-auto scrollbar-hide relative z-0 p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
