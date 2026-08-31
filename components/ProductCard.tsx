"use client";

import { useState } from "react";
import { ShoppingCart, CheckCircle, XCircle, Eye, X, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  original_price?: number | null;
  image_url: string;
  description: string;
  in_stock: boolean;
  stock_quantity?: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const [isOpen, setIsOpen] = useState(false);
  const { addToCart } = useCart();

  const currentStock = product.stock_quantity ?? (product.in_stock ? 1 : 0);
  const isAvailable = currentStock > 0;

  // Calculate discount percentage if original_price is higher than price
  const hasDiscount =
    product.original_price && Number(product.original_price) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(product.original_price) - Number(product.price)) /
          Number(product.original_price)) *
          100
      )
    : 0;

  return (
    <>
      <div className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 overflow-hidden hover:border-slate-400 dark:hover:border-slate-700 shadow-sm dark:shadow-none transition duration-200">
        
        {/* Product Image Section */}
        <div
          onClick={() => setIsOpen(true)}
          className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer"
        >
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          
          {/* Category & Sale Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white/90 dark:bg-slate-950/80 backdrop-blur text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              {product.category}
            </span>
            {hasDiscount && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase bg-rose-500 text-white shadow-md flex items-center gap-1 animate-pulse">
                <Tag className="w-2.5 h-2.5" /> -{discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle className="w-3 h-3" />
                {currentStock <= 3 ? `Only ${currentStock} left!` : "In Stock"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                <XCircle className="w-3 h-3" /> Sold Out
              </span>
            )}
          </div>

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[1px]">
            <Eye className="w-4 h-4" /> Quick Specs
          </div>
        </div>

        {/* Product Details Section */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <h3
              onClick={() => setIsOpen(true)}
              className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-1 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
            >
              {product.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
            {product.description && product.description.length > 70 && (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-1 cursor-pointer block"
              >
                Read full specs & details →
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  KSH {Number(product.price).toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 line-through font-semibold">
                    KSH {Number(product.original_price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => addToCart(product)}
              disabled={!isAvailable}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isAvailable
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer active:scale-95"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isAvailable ? "Add to Cart" : "Sold Out"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Spec Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {product.category}
                </span>
                {hasDiscount && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-500 text-white">
                    -{discountPercent}% OFF
                  </span>
                )}
                {isAvailable ? (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> In Stock at Juja Store
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Currently Sold Out
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {product.name}
              </h2>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  KSH {Number(product.price).toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through font-semibold">
                    KSH {Number(product.original_price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Full Specifications & Description
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description || "No specific details provided for this product."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close Specs
              </button>
              <button
                type="button"
                onClick={() => {
                  addToCart(product);
                  setIsOpen(false);
                }}
                disabled={!isAvailable}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  isAvailable
                    ? "bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer active:scale-95"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isAvailable ? "Add to Cart" : "Sold Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}