"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Plus, Check, Eye, X, AlertCircle, Sparkles } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  image_url: string;
  description?: string;
  in_stock: boolean;
  stock_quantity?: number;
  available_sizes?: string[];
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.available_sizes && product.available_sizes.length > 0
      ? product.available_sizes[0]
      : null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const discountPercent =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) * 100
        )
      : null;

  const stock = product.stock_quantity ?? (product.in_stock ? 10 : 0);
  const isOutOfStock = !product.in_stock || stock <= 0;
  const isLowStock = stock > 0 && stock <= 3;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart({
      ...product,
      selectedSize: selectedSize || undefined,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  return (
    <>
      <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
        
        {/* Top Image Container */}
        <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Top Badges: Discount & Stock */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
            {/* Blinking / Pulsing Discount Pill */}
            {discountPercent ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white font-black text-[10px] tracking-wide shadow-md animate-pulse">
                <Sparkles className="w-2.5 h-2.5" />
                {discountPercent}% OFF
              </span>
            ) : (
              <span />
            )}

            {/* Live Stock Indicator */}
            {isOutOfStock ? (
              <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-rose-400 font-bold text-[10px] backdrop-blur-xs border border-rose-500/30">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] animate-bounce shadow-xs">
                Only {stock} Left!
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-black font-bold text-[10px] backdrop-blur-xs">
                In Stock
              </span>
            )}
          </div>

          {/* Quick View Details Button Overlay */}
          <button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition shadow-md cursor-pointer hover:scale-105"
            title="View full specifications & details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Product Details Section */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">
              <span>{product.category}</span>
              {product.available_sizes && product.available_sizes.length > 0 && (
                <span className="text-[10px] lowercase text-emerald-600 dark:text-emerald-400 font-bold">
                  {product.available_sizes.length} sizes
                </span>
              )}
            </div>

            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">
              {product.name}
            </h3>

            {/* Price Row */}
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-base font-black text-slate-900 dark:text-white">
                KSH {Number(product.price).toLocaleString()}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  KSH {Number(product.original_price).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Size Selection Pills */}
          {product.available_sizes && product.available_sizes.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Size:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.available_sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      selectedSize === size
                        ? "bg-emerald-500 text-black border-emerald-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add To Cart Action */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 shadow-sm ${
              isOutOfStock
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : isAdded
                ? "bg-emerald-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-400 text-black"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Added to Cart!</span>
              </>
            ) : isOutOfStock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <button
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4 items-start">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-24 h-24 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
              />
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                  {product.category}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {product.name}
                </h2>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  KSH {Number(product.price).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Description Body */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Product Details & Specifications
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description || "Authentic quality sporting gear verified by Elim Sports. Available for instant pickup at Moms & Dads Centre, Juja or campus/rider delivery."}
              </p>
            </div>

            {/* Stock info in modal */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2">
              <AlertCircle className="w-4 h-4 text-emerald-500" />
              <span>
                Inventory Status:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {isOutOfStock ? "Out of Stock" : `${stock} available in store`}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                handleAddToCart();
                setIsDetailsOpen(false);
              }}
              disabled={isOutOfStock}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98"
            >
              Add to Order (KSH {Number(product.price).toLocaleString()})
            </button>
          </div>
        </div>
      )}
    </>
  );
}