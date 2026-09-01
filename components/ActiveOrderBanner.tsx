"use client";

import { useEffect, useState, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { restoreOrderStock } from "@/lib/stockHelper";
import { Clock, Edit3, X, Loader2 } from "lucide-react";

interface ActiveOrderSession {
  orderId: string;
  createdAt: string | number;
  items: Array<{
    product_id: string;
    name: string;
    category?: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
  customerName: string;
  totalAmount: number;
}

export default function ActiveOrderBanner() {
  const { addToCart, setIsCartOpen } = useCart();
  const [activeSession, setActiveSession] = useState<ActiveOrderSession | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const evaluateSession = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("elim_active_order");
      if (!stored) {
        setActiveSession(null);
        setTimeLeft(0);
        return;
      }

      const parsed: ActiveOrderSession = JSON.parse(stored);
      const createdTime = typeof parsed.createdAt === "number" 
        ? parsed.createdAt 
        : new Date(parsed.createdAt).getTime();

      const now = Date.now();
      const threeMinutes = 3 * 60 * 1000; // 3-Minute Window
      const elapsed = now - createdTime;

      if (!isNaN(createdTime) && elapsed < threeMinutes) {
        const remaining = Math.max(1, Math.floor((threeMinutes - Math.max(0, elapsed)) / 1000));
        setActiveSession(parsed);
        setTimeLeft(remaining);
      } else {
        localStorage.removeItem("elim_active_order");
        setActiveSession(null);
        setTimeLeft(0);
      }
    } catch (err) {
      console.error("[ActiveOrderBanner] Parse error:", err);
      setActiveSession(null);
      setTimeLeft(0);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    evaluateSession();

    const pollInterval = setInterval(evaluateSession, 1000);

    const onCustomEvent = () => evaluateSession();
    window.addEventListener("elim_order_placed", onCustomEvent);
    window.addEventListener("storage", onCustomEvent);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("elim_order_placed", onCustomEvent);
      window.removeEventListener("storage", onCustomEvent);
    };
  }, [evaluateSession]);

  if (!mounted || !activeSession || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const handleModifyOrder = async () => {
    if (
      !confirm(
        "This will cancel your reservation, restore store inventory, and return items to your cart. Proceed?"
      )
    ) {
      return;
    }

    setIsProcessing(true);

    try {
      if (activeSession.items && activeSession.items.length > 0) {
        await restoreOrderStock(activeSession.items);
      }

      await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", activeSession.orderId);

      for (const item of activeSession.items) {
        addToCart({
          id: item.product_id,
          name: item.name,
          category: item.category || "General",
          price: item.price,
          in_stock: true,
          selectedSize: item.size,
        });
      }

      localStorage.removeItem("elim_active_order");
      setActiveSession(null);
      setTimeLeft(0);
      setIsCartOpen(true);
    } catch (err) {
      console.error("Modify order failed:", err);
      alert("Could not cancel order automatically. Please reach us directly on WhatsApp.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.removeItem("elim_active_order");
    setActiveSession(null);
    setTimeLeft(0);
  };

  return (
    <div 
      style={{ zIndex: 99999 }}
      className="fixed bottom-24 right-4 sm:right-6 w-[calc(100%-2rem)] sm:w-96 pointer-events-auto shadow-2xl"
    >
      <div className="p-4 rounded-2xl bg-slate-900 border-2 border-emerald-500 text-white shadow-2xl space-y-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-black text-xs">Active Order Window</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-[11px] font-bold">
            {formattedTime}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-snug">
          Need to change shoe size or items for <strong className="text-white">{activeSession.customerName}</strong>? (KSH {activeSession.totalAmount.toLocaleString()})
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleModifyOrder}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98 shadow-md"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Restoring Cart...</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit / Modify Order</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss timer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}