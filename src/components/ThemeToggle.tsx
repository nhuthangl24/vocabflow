"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ isCollapsed }: { isCollapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 opacity-0"></div>;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`flex items-center gap-3 p-2.5 rounded-xl font-semibold text-[13px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-neutral-400 dark:hover:text-slate-100 dark:hover:bg-neutral-800 transition-colors dark:text-neutral-300 ${isCollapsed ? 'justify-center mx-auto w-12 h-12' : 'w-full'}`}
      title={theme === "dark" ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
    >
      <div className="flex items-center justify-center w-5 h-5 shrink-0">
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </div>
      <span className={`truncate whitespace-nowrap hidden md:block text-left transition-all duration-300 ${isCollapsed ? "opacity-0 w-0 -ml-3" : "opacity-100 w-auto"}`}>
        {theme === "dark" ? "Giao diện Sáng" : "Giao diện Tối"}
      </span>
    </button>
  );
}

// force rebuild 2

// force rebuild 13

