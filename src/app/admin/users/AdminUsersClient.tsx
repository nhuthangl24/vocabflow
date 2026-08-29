"use client";

import { useState } from "react";
import { Search, Users, Shield, ArrowRight } from "lucide-react";
import { updateUserPlan } from "./actions";

type User = {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: {
    plan?: string;
  };
};

export default function AdminUsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; newPlan: "free" | "pro" } | null>(null);

  const filteredUsers = users.filter(u => 
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
  );

  const executePlanChange = async (userId: string, newPlan: "free" | "pro") => {
    setLoadingId(userId);
    try {
      const res = await updateUserPlan(userId, newPlan);
      if (res.success) {
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, user_metadata: { ...u.user_metadata, plan: newPlan } } 
            : u
        ));
      } else {
        alert("Lỗi khi cập nhật gói: " + res.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Quản lý Người dùng & CRM
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Quản lý người dùng, xem dòng thời gian (timeline), và thay đổi gói cước.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Tìm theo ID hoặc Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111] border border-neutral-800 text-sm rounded-md pl-9 pr-4 py-1.5 focus:outline-none focus:border-neutral-600 text-white w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-neutral-800 rounded-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-[13px] font-mono whitespace-nowrap">
            <thead className="bg-[#151515] text-neutral-400 border-b border-neutral-800 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-2 font-medium">User ID</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Gói cước</th>
                <th className="px-4 py-2 font-medium">Ngày tham gia</th>
                <th className="px-4 py-2 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredUsers.map((u) => {
                const isPro = u.user_metadata?.plan === 'pro';
                const isLoading = loadingId === u.id;
                
                return (
                  <tr key={u.id} className="hover:bg-[#1a1a1a] transition-colors group">
                    <td className="px-4 py-2.5 text-neutral-500">{u.id}</td>
                    <td className="px-4 py-2.5 text-white font-sans text-sm">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${isPro ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                        {isPro ? 'PRO' : 'FREE'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500" suppressHydrationWarning>
                      {new Date(u.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setConfirmAction({ userId: u.id, newPlan: isPro ? 'free' : 'pro' })}
                        disabled={isLoading}
                        className="px-2 py-1 bg-neutral-800 text-neutral-300 hover:text-white rounded hover:bg-neutral-700 disabled:opacity-50 text-xs font-sans"
                      >
                        {isLoading ? "Đang xử lý..." : (isPro ? "Hạ cấp Free" : "Nâng cấp PRO")}
                      </button>
                      <button className="px-2 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded text-xs font-sans">
                        Timeline <ArrowRight className="w-3 h-3 inline ml-1" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-600 font-sans">Không tìm thấy người dùng.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-[#151515] border-t border-neutral-800 px-4 py-2 text-xs text-neutral-500 flex justify-between items-center">
          <span>Tổng cộng {filteredUsers.length} người dùng</span>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#111] border border-neutral-800 rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-2">Xác nhận thay đổi gói</h3>
            <p className="text-sm text-neutral-400 mb-6 font-sans">
              Bạn có chắc muốn đổi gói của người dùng này thành <strong className="text-white">{confirmAction.newPlan.toUpperCase()}</strong>?
            </p>
            <div className="flex justify-end gap-3 font-sans">
              <button 
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  executePlanChange(confirmAction.userId, confirmAction.newPlan);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
