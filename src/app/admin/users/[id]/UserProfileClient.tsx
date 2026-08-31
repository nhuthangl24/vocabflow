"use client";

import { useState } from "react";
import { 
  ArrowLeft, LayoutDashboard, Activity, BookOpen, Cpu, Video, 
  Headphones, Type, BrainCircuit, CreditCard, Laptop, Bell, Shield,
  MoreVertical, X
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  updateUserPlan, 
  toggleBanUser, 
  resetUserAIQuota, 
  resetUserSRSData, 
  createImpersonationLink 
} from "./actions";
import OverviewTab from "./components/OverviewTab";
import ActivityTab from "./components/ActivityTab";
import AITab from "./components/AITab";
import VideosTab from "./components/VideosTab";
import StudyTab from "./components/StudyTab";
import FlashcardsTab from "./components/FlashcardsTab";
import BillingTab from "./components/BillingTab";
import SessionsTab from "./components/SessionsTab";
import NotificationsTab from "./components/NotificationsTab";
import SecurityTab from "./components/SecurityTab";

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

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "study", label: "Study Analytics", icon: BookOpen },
  { id: "ai", label: "AI Usage", icon: Cpu },
  { id: "videos", label: "Videos", icon: Video },
  { id: "flashcards", label: "Flashcards & SRS", icon: BrainCircuit },
  { id: "billing", label: "Billing & Plans", icon: CreditCard },
  { id: "sessions", label: "Sessions", icon: Laptop },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function UserProfileClient({ user }: { user: AdminUser }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(user.current_plan);
  const router = useRouter();

  const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
  const isOnline = user.last_active_at && (new Date().getTime() - new Date(user.last_active_at).getTime() < 1000 * 60 * 15);

  const handleAction = async (actionFn: () => Promise<{success: boolean, error?: string, url?: string}>, successMsg: string) => {
    setActionMenuOpen(false);
    const toastId = toast.loading("Processing...");
    try {
      const res = await actionFn();
      if (res.success) {
        toast.success(successMsg, { id: toastId });
        if (res.url) window.location.href = res.url;
        else router.refresh();
      } else {
        toast.error(res.error || "Action failed", { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: toastId });
    }
  };

  const handlePlanChange = () => {
    setPlanModal(true);
    setActionMenuOpen(false);
  };

  const submitPlanChange = () => {
    if (!selectedPlan) return;
    handleAction(() => updateUserPlan(user.id, selectedPlan.toUpperCase()), `Updated plan to ${selectedPlan.toUpperCase()}`);
    setPlanModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg font-bold text-white shadow-sm overflow-hidden relative">
              {user.avatar_url ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : user.email?.charAt(0).toUpperCase()}
              {isOnline && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {user.full_name || "Unknown User"}
                {isBanned && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs uppercase tracking-wider font-bold">Banned</span>}
              </h1>
              <div className="text-sm text-neutral-500 flex items-center gap-2">
                {user.email} <span className="text-neutral-700">•</span> <span className="font-mono text-xs">{user.id}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions Menu */}
        <div className="relative">
          <button 
            onClick={() => setActionMenuOpen(!actionMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Admin Actions <MoreVertical className="w-4 h-4" />
          </button>
          
          {actionMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden" onMouseLeave={() => setActionMenuOpen(false)}>
              <div className="p-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Account</div>
              <button onClick={handlePlanChange} className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800">Change Plan</button>
              <button onClick={() => handleAction(() => toggleBanUser(user.id, !!isBanned), isBanned ? "User unbanned" : "User suspended")} className="w-full text-left px-4 py-2 text-sm text-amber-400 hover:bg-neutral-800">Suspend User</button>
              <button onClick={() => handleAction(() => toggleBanUser(user.id, !!isBanned), isBanned ? "User unbanned" : "User banned")} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-800">{isBanned ? 'Unban User' : 'Ban User'}</button>
              
              <div className="border-t border-neutral-800 my-1" />
              <div className="p-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Data & Limits</div>
              <button onClick={() => handleAction(() => resetUserAIQuota(user.id), "AI Quota reset")} className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800">Reset AI Quota</button>
              <button onClick={() => handleAction(() => resetUserSRSData(user.id), "SRS Data reset")} className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800">Reset SRS Data</button>
              
              <div className="border-t border-neutral-800 my-1" />
              <button onClick={() => handleAction(() => createImpersonationLink(user.id), "Generating link...")} className="w-full text-left px-4 py-2 text-sm text-indigo-400 hover:bg-neutral-800">Impersonate (Login As)</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 bg-[#0a0a0a] border border-neutral-800/60 rounded-xl overflow-hidden p-2 flex flex-col gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400" 
                    : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-neutral-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-6 min-h-[500px]">
          {activeTab === "overview" && <OverviewTab user={user} />}
          {activeTab === "activity" && <ActivityTab userId={user.id} />}
          {activeTab === "study" && <StudyTab userId={user.id} />}
          {activeTab === "ai" && <AITab userId={user.id} />}
          {activeTab === "videos" && <VideosTab userId={user.id} />}
          {activeTab === "flashcards" && <FlashcardsTab userId={user.id} />}
          {activeTab === "billing" && <BillingTab userId={user.id} />}
          {activeTab === "sessions" && <SessionsTab userId={user.id} />}
          {activeTab === "notifications" && <NotificationsTab userId={user.id} />}
          {activeTab === "security" && <SecurityTab userId={user.id} />}
        </div>
        
      </div>

      {/* Plan Change Modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-sm w-full shadow-2xl border border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-neutral-800">
              <h3 className="font-bold text-white">Thay đổi gói cước</h3>
              <button onClick={() => setPlanModal(false)} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">Chọn gói cước mới</label>
                <div className="grid grid-cols-2 gap-2">
                  {['FREE', 'BASIC', 'PRO', 'LIFETIME'].map(plan => (
                    <button
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                        selectedPlan === plan 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                          : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-600'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                Hiện tại: <span className="font-bold text-white">{user.current_plan}</span> → Mới: <span className="font-bold text-indigo-400">{selectedPlan}</span>
              </p>
            </div>
            <div className="p-4 bg-neutral-900/50 border-t border-neutral-800 flex justify-end gap-3">
              <button onClick={() => setPlanModal(false)} className="px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                Huỷ
              </button>
              <button 
                onClick={submitPlanChange}
                disabled={selectedPlan === user.current_plan}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
