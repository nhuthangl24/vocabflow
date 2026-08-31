"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Settings } from "lucide-react";

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard", href: "/admin/payments", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/payments/orders", icon: Receipt },
    { name: "Settings", href: "/admin/payments/settings", icon: Settings },
  ];

  return (
    <div className="max-w-[1200px] w-full mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            VocabFlow <span className="text-neutral-500 font-normal">/</span> Billing
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Enterprise Payment & Subscription Management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 mb-8 overflow-x-auto custom-scrollbar">
        {tabs.map(tab => {
          const isActive = pathname === tab.href || (tab.href !== '/admin/payments' && pathname.startsWith(tab.href));
          return (
            <Link 
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${isActive ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-600'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </Link>
          )
        })}
      </div>

      {/* Content */}
      <div className="w-full">
        {children}
      </div>

    </div>
  );
}
