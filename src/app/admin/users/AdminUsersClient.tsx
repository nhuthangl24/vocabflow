"use client";

import { useState } from "react";
import { MoreVertical, Search, Zap, Shield } from "lucide-react";
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

  const filteredUsers = users.filter(u => 
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
  );

  const handlePlanChange = async (userId: string, newPlan: "free" | "pro") => {
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
        alert("Failed to update plan: " + res.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header and Search */}
      <div className="flex justify-between items-center bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold">
            <Shield className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg">Users Management</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-1">View and manage registered users and their subscription plans.</p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl flex-1 relative">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm text-slate-600 dark:text-neutral-300">
            <thead className="bg-slate-50/80 dark:bg-white/5 text-slate-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] font-bold sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">User ID</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">Email Address</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">Plan</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">Joined Date</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredUsers.map((u) => {
                const isPro = u.user_metadata?.plan === 'pro';
                
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 dark:text-neutral-500 group-hover:text-slate-500 dark:group-hover:text-neutral-400 transition-colors">{u.id.substring(0, 12)}...</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      {isPro ? (
                        <span className="px-3 py-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full font-bold text-[11px] flex items-center w-fit gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.15)] uppercase tracking-wide">
                          <Zap className="w-3 h-3" fill="currentColor" /> Pro
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100/50 border border-slate-200 dark:bg-white/5 dark:border-white/10 text-slate-500 dark:text-neutral-400 rounded-full font-bold text-[11px] uppercase tracking-wide">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-neutral-400 font-medium text-xs">
                      {new Date(u.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isPro ? (
                        <button 
                          onClick={() => handlePlanChange(u.id, "free")}
                          disabled={loadingId === u.id}
                          className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-300 rounded-xl transition-all duration-200 disabled:opacity-50 ml-auto flex items-center gap-2"
                        >
                          Downgrade
                        </button>
                      ) : (
                        <button 
                          onClick={() => handlePlanChange(u.id, "pro")}
                          disabled={loadingId === u.id}
                          className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 flex items-center ml-auto gap-2"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" /> Upgrade to Pro
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
