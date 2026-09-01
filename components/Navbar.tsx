"use client";

import Link from "next/link";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
       <Link href="/" className="flex items-center gap-3 group">
  <div className="relative p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:border-emerald-500/50 shadow-sm transition-all duration-300">
    <img
      src="/logo.Elim Sports logo.png"
      alt="Elim Sports Logo"
      className="w-9 h-9 object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
    />
    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-pulse" />
  </div>

  <div className="flex flex-col">
    <div className="flex items-center gap-1.5">
      <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none">
        ELIM<span className="text-emerald-500">SPORTS</span>
      </span>
      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider">
        JUJA
      </span>
    </div>
    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mt-1">
      Authentic Gear & Apparel
    </span>
  </div>
</Link>
        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition shadow-sm"
            title="Admin Inventory Portal"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="bg-black text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}