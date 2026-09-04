"use client";

import { useState } from "react";
import SettingsForm from "./SettingsForm";
import BillingHistory from "./BillingHistory";

export default function SettingsClient({ user, orders }: { user: any, orders: any[] }) {
  const [activeTab, setActiveTab] = useState<"profile" | "billing">("profile");

  return (
    <div className="p-4 sm:p-8 w-full max-w-3xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-white">Cài đặt</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-neutral-300 dark:text-neutral-400">Quản lý tài khoản và tùy chọn của bạn.</p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-neutral-800 mb-8 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("profile")}
          className={`py-3 px-4 sm:px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "profile"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          }`}
        >
          Hồ sơ cá nhân
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`py-3 px-4 sm:px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "billing"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          }`}
        >
          Lịch sử thanh toán
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="animate-in fade-in duration-300">
          <SettingsForm user={user} />
        </div>
      )}
      
      {activeTab === "billing" && (
        <div className="animate-in fade-in duration-300">
          <BillingHistory orders={orders} />
        </div>
      )}
    </div>
  );
}
