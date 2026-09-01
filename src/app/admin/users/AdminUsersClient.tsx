"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, Shield, MoreHorizontal, ChevronLeft, ChevronRight, Activity, Clock, Zap, Crown, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  registered_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  current_plan: string;
  total_tokens_used: number;
  total_credits_used: number;
  total_study_time_seconds: number;
  total_videos: number;
  total_sessions: number;
  last_country: string | null;
  last_active_at: string | null;
};

export default function AdminUsersClient({ 
  users, 
  totalCount, 
  stats,
  currentPage,
  search,
  planFilter
}: { 
  users: AdminUser[];
  totalCount: number;
  stats: { total: number; pro: number; basic: number; };
  currentPage: number;
  search: string;
  planFilter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchInput, setSearchInput] = useState(search);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) params.set("search", searchInput);
    else params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilter = (plan: string) => {
    const params = new URLSearchParams(searchParams);
    if (plan !== "all") params.set("plan", plan);
    else params.delete("plan");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/60 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            User Management Center
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Quản lý tài khoản, trạng thái và thống kê hệ thống (SaaS Enterprise)</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo email / ID..." 
              className="pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 w-full md:w-64 transition-all"
            />
          </div>
          <select 
            value={planFilter}
            onChange={(e) => handleFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-300 outline-none focus:border-indigo-500"
          >
            <option value="all">Tất cả gói</option>
            <option value="FREE">Free</option>
            <option value="BASIC">Basic</option>
            <option value="PRO">Pro</option>
          </select>
        </form>
      </div>

      {/* Stats */}
      <div className="flex-none grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="text-sm font-medium text-neutral-400 mb-1">Tổng User</div>
          <div className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
          <div className="text-sm font-medium text-indigo-400 mb-1">PRO User</div>
          <div className="text-2xl font-bold text-white">{stats.pro.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-sm font-medium text-emerald-400 mb-1">BASIC User</div>
          <div className="text-2xl font-bold text-white">{stats.basic.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="text-sm font-medium text-amber-400 mb-1">Online (24h)</div>
          <div className="text-2xl font-bold text-white">--</div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40 flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-xs text-neutral-500 bg-neutral-900/40 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-medium">Người dùng</th>
                <th className="px-5 py-4 font-medium">Trạng thái</th>
                <th className="px-5 py-4 font-medium">Hoạt động</th>
                <th className="px-5 py-4 font-medium">Chi phí AI / Token</th>
                <th className="px-5 py-4 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-neutral-500">Không tìm thấy user nào</td></tr>
              ) : users.map((user) => {
                const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                const isOnline = user.last_active_at && (new Date().getTime() - new Date(user.last_active_at).getTime() < 1000 * 60 * 15); // 15 mins
                
                return (
                  <tr key={user.id} className="hover:bg-neutral-900/30 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/users/${user.id}`)}>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-medium text-white shrink-0 overflow-hidden relative">
                          {user.avatar_url ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : user.email?.charAt(0).toUpperCase()}
                          {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />}
                        </div>
                        <div>
                          <div className="text-white font-medium flex items-center gap-2">
                            {user.full_name || user.email.split('@')[0]}
                            {user.current_plan === 'PRO' && <Crown className="w-3 h-3 text-indigo-400" />}
                          </div>
                          <div className="text-xs text-neutral-500">{user.email}</div>
                          <div className="text-[10px] text-neutral-600 font-mono mt-0.5">{user.id.substring(0,8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-start">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider bg-red-500/10 text-red-400 border-red-500/20">
                            <Ban className="w-3 h-3" /> Banned
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                            user.current_plan === 'PRO' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                            user.current_plan === 'BASIC' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-neutral-800/50 text-neutral-400 border-neutral-700'
                          }`}>
                            {user.current_plan}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-neutral-300 flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-neutral-500" />
                          {user.total_sessions || 0} phiên • {user.total_videos || 0} videos
                        </div>
                        <div className="text-[10px] text-neutral-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Active: {user.last_active_at ? formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true, locale: vi }) : "Chưa rõ"}
                        </div>
                        <div className="text-[10px] text-neutral-500 flex items-center gap-1.5">
                          Đăng ký: {new Date(user.registered_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <Zap className="w-3 h-3 text-amber-400" />
                          {(user.total_tokens_used || 0).toLocaleString()} tokens
                        </div>
                        <div className="text-[11px] font-medium text-emerald-400">
                          {(user.total_credits_used || 0).toLocaleString()} VNĐ
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${user.id}`); }}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-neutral-800/60 bg-neutral-900/20 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Trang {currentPage} / {totalPages} (Tổng {totalCount} users)
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => handlePage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handlePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
