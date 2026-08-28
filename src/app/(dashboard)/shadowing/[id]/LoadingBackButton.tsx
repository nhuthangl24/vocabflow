"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoadingBackButton({ href, label }: { href: string, label: string }) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Link 
      href={href}
      onClick={(e) => {
        if (isNavigating) {
          e.preventDefault();
          return;
        }
        setIsNavigating(true);
      }}
      className={`inline-flex items-center text-sm font-medium transition-colors mb-4 px-3 py-1.5 rounded-lg border dark:text-neutral-400 dark:bg-[#0a0a0a] dark:border-neutral-800 dark:hover:bg-neutral-900 ${
        isNavigating 
          ? "bg-indigo-50 text-indigo-600 border-indigo-100 opacity-70 cursor-not-allowed" 
          : "text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border-slate-100"
      }`}
    >
      {isNavigating ? (
        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <ArrowLeft className="w-4 h-4 mr-2" />
      )}
      {isNavigating ? "Đang tải..." : label}
    </Link>
  );
}
