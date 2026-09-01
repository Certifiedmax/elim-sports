"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  original_price?: number | null;
  stock_quantity: number;
  in_stock: boolean;
  image_url: string;
  description?: string;
  available_sizes?: string[];
  created_at?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.available_sizes && product.available_sizes.length > 0
      ? product.available_sizes[0]
      : null
  );
  const [addedAnimation, setAddedAnimation] = useState(false);

  const hasSizes = product.available_sizes && product.available_sizes.length > 0;
  const isOutOfStock = (product.stock_quantity ?? (product.in_stock ? 1 : 0)) === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    // Pass the product to the cart
    addToCart(product);

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const hasDiscount =
    product.original_price && Number(product.original_price) > Number(product.price);

  return (
    <div className="group flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <div>
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-md">
              Offer
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-slate-900 text-rose-400 border border-rose-500/40 text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {product.category}
            </span>
            {product.stock_quantity <= 2 && product.stock_quantity > 0 && (
              <span className="text-[10px] text-amber-500 font-bold">Only {product.stock_quantity} left</span>
            )}
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Size Pills (If product has sizes) */}
          {hasSizes && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Select Size:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.available_sizes?.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSize === sz
                        ? "bg-emerald-500 text-black shadow-sm scale-105"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Pricing & Add Action */}
      <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
            KSH {Number(product.price).toLocaleString()}
          </div>
          {hasDiscount && (
            <div className="text-[11px] text-slate-400 line-through">
              KSH {Number(product.original_price).toLocaleString()}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            addedAnimation
              ? "bg-emerald-600 text-white"
              : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm"
          }`}
        >
          {addedAnimation ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}