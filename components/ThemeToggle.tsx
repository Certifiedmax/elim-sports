"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800" />
    );
  }

  // Check the actual class on the HTML tag
  const isDark = document.documentElement.classList.contains("dark") || theme === "dark";

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";

    // 1. Force the root HTML class directly
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. Persist in next-themes / localStorage
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer shadow-sm flex items-center justify-center active:scale-95"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}