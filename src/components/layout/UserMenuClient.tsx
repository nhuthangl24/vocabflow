"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";

type UserMenuClientProps = {
  user: any;
  isCollapsed?: boolean;
};

export default function UserMenuClient({ user, isCollapsed }: UserMenuClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setLocalUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const fullName = localUser?.user_metadata?.full_name || "";
  const avatarUrl = localUser?.user_metadata?.avatar_url || "";
  const email = localUser?.email || "";
  const displayName = fullName || email.split("@")[0] || "User";
  const initial = fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : "U");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (!localUser) {
    return (
      <div className="relative">
        <Link 
          href="/login"
          className={`flex items-center ${isCollapsed ? 'justify-center p-0' : 'justify-center p-2'} hover:bg-slate-50 bg-white border border-slate-200 rounded-xl cursor-pointer transition-colors shadow-sm dark:bg-[#0a0a0a] dark:border-neutral-700`}
          title={isCollapsed ? "Đăng nhập" : undefined}
        >
          {isCollapsed ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 dark:text-neutral-300">
              <UserIcon className="w-5 h-5" />
            </div>
          ) : (
            <div className="flex-1 text-center">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">Đăng nhập</span>
            </div>
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`flex items-center ${isCollapsed ? 'justify-center p-0' : 'gap-3 p-2 -mx-2'} hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer transition-colors`}
        onClick={() => setIsOpen(!isOpen)}
        title={isCollapsed ? "Tài khoản" : undefined}
      >
        <div className={`${isCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm border border-indigo-600/20 overflow-hidden`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-900 truncate dark:text-white">{displayName}</p>
            <p className="text-[11px] font-medium text-slate-500 truncate dark:text-neutral-400">{email}</p>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full min-w-[200px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-200 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 dark:bg-[#0a0a0a] dark:border-neutral-700">
          <div className="px-4 py-2 border-b border-slate-100 mb-1 dark:border-neutral-800">
            <p className="text-xs font-bold text-slate-900 truncate dark:text-white">{displayName}</p>
            <p className="text-[10px] text-slate-500 truncate dark:text-neutral-400">{email}</p>
          </div>
          
          <Link 
            href="/settings" 
            className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors w-full text-left dark:text-neutral-200"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4" />
            Cài đặt tài khoản
          </Link>
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors w-full text-left mt-1 border-t border-slate-100 pt-2 dark:border-neutral-800"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
