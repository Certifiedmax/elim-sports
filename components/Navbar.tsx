"use client";

import Link from "next/link";
import { Shield, ShoppingCart, MessageCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-0.5">
            <img 
              src="/Elim Sports logo.png" 
              alt="Elim Sports Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
              ELIM SPORTS
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 tracking-wider uppercase font-semibold">
              Africa Sports Ltd
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* Cart Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer active:scale-95"
            aria-label="Open Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-[10px] rounded-full font-black leading-none">
                {totalItems}
              </span>
            )}
          </button>

          {/* Owner Portal Link */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 transition"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Owner Portal</span>
          </Link>
        </div>
      </div>
    </header>
  );
}