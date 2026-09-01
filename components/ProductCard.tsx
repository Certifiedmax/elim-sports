"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Plus, Check, Eye, X, AlertCircle, Sparkles, ChevronLeft, ChevronRight, Zap } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  image_url?: string;
  images?: string[];
  description?: string;
  in_stock: boolean;
  stock_quantity?: number;
  available_sizes?: string[];
  size_stocks?: Record<string, number>; // e.g. { "40": 2, "41": 0, "42": 4 }
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Normalize Images
  const rawImages =
    product.images && product.images.length > 0
      ? product.images.filter((img) => Boolean(img && img.trim()))
      : product.image_url
      ? [product.image_url]
      : ["/placeholder.png"];

  const imageList = rawImages.length > 0 ? rawImages : ["/placeholder.png"];
  const displayCoverImage = imageList[0];
  const activeModalImage = imageList[activeImageIdx] || displayCoverImage;

  // Resolve sizes list
  const sizesList: string[] =
    product.available_sizes || (product.size_stocks ? Object.keys(product.size_stocks) : []);
  const hasSizes = sizesList.length > 0;

  const isFootwear =
    product.category?.toLowerCase().includes("footwear") ||
    product.category?.toLowerCase().includes("boot");
  const unitLabel = isFootwear ? "pairs" : "units";

  // Exact quantity helper per size
  const getSizeQuantity = (size: string): number => {
    if (product.size_stocks && typeof product.size_stocks[size] === "number") {
      return product.size_stocks[size];
    }
    if (hasSizes) {
      return product.in_stock ? 1 : 0;
    }
    return product.stock_quantity ?? (product.in_stock ? 1 : 0);
  };

  // Find first size that is actually in stock
  const firstAvailableSize =
    sizesList.find((s) => getSizeQuantity(s) > 0) || (hasSizes ? sizesList[0] : null);
  const [selectedSize, setSelectedSize] = useState<string | null>(firstAvailableSize);

  const discountPercent =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  // Total stock calculated from size breakdown if present
  const totalStock =
    product.size_stocks && Object.keys(product.size_stocks).length > 0
      ? Object.values(product.size_stocks).reduce((acc, count) => acc + count, 0)
      : product.stock_quantity ?? (product.in_stock ? 10 : 0);

  const isOutOfStock = !product.in_stock || totalStock <= 0;
  const selectedSizeQty = selectedSize ? getSizeQuantity(selectedSize) : totalStock;
  const isSelectedSizeSoldOut = selectedSize ? selectedSizeQty <= 0 : isOutOfStock;

  const handleAddToCart = () => {
    if (isOutOfStock || (hasSizes && isSelectedSizeSoldOut)) return;

    addToCart({
      ...product,
      image_url: displayCoverImage,
      selectedSize: selectedSize || undefined,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  // Instant direct single-item order via WhatsApp
  const handleBuyNow = () => {
    if (isOutOfStock || (hasSizes && isSelectedSizeSoldOut)) return;

    const phone = "254794268983";
    const sizeTag = selectedSize ? ` [Size: ${selectedSize}]` : "";
    let message = `🏸 *INSTANT ORDER - ELIM SPORTS*\n`;
    message += `─────────────────────────\n`;
    message += `Product: *${product.name}*${sizeTag}\n`;
    message += `Category: ${product.category}\n`;
    message += `Price: KSH ${Number(product.price).toLocaleString()}\n`;
    message += `Fulfillment: Store Pickup (Moms & Dads Centre, Juja) / Campus Delivery\n`;
    message += `─────────────────────────\n`;
    message += `Please reserve this item and send confirmation!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    setIsDetailsOpen(false);
  };

  const nextModalImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % imageList.length);
  };

  const prevModalImage = () => {
    setActiveImageIdx((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  return (
    <>
      <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
        
        {/* Top Image Container */}
        <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden">
          <img
            src={displayCoverImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Photo Count Indicator */}
          {imageList.length > 1 && (
            <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white pointer-events-none">
              1/{imageList.length} photos
            </span>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
            {discountPercent ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white font-black text-[10px] tracking-wide shadow-md animate-pulse">
                <Sparkles className="w-2.5 h-2.5" />
                {discountPercent}% OFF
              </span>
            ) : (
              <span />
            )}

            {isOutOfStock ? (
              <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-rose-400 font-bold text-[10px] backdrop-blur-xs border border-rose-500/30">
                Out of Stock
              </span>
            ) : totalStock <= 3 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] animate-bounce shadow-xs">
                Only {totalStock} Left!
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-black font-bold text-[10px] backdrop-blur-xs">
                In Stock
              </span>
            )}
          </div>

          {/* Quick View Button */}
          <button
            type="button"
            onClick={() => {
              setActiveImageIdx(0);
              setIsDetailsOpen(true);
            }}
            className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition shadow-md cursor-pointer hover:scale-105"
            title="View full specifications & all photos"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Product Details Section */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">
              <span>{product.category}</span>
              {hasSizes && (
                <span className="text-[10px] lowercase text-emerald-600 dark:text-emerald-400 font-bold">
                  {sizesList.length} sizes
                </span>
              )}
            </div>

            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">
              {product.name}
            </h3>

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

          {/* Dynamic Size Selection with Live Quantity Indicators */}
          {hasSizes && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-500 dark:text-slate-400">Select Size:</span>
                {selectedSize && (
                  <span
                    className={
                      selectedSizeQty > 0
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-rose-500 font-bold"
                    }
                  >
                    {selectedSizeQty > 0 ? `${selectedSizeQty} left` : "Sold out"}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {sizesList.map((size) => {
                  const qty = getSizeQuantity(size);
                  const isSoldOut = qty <= 0;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => setSelectedSize(size)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                        isSoldOut
                          ? "opacity-35 bg-slate-100 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800 line-through cursor-not-allowed"
                          : isSelected
                          ? "bg-emerald-500 text-black border-emerald-500 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                      }`}
                    >
                      <span>{size}</span>
                      {!isSoldOut && qty <= 2 && (
                        <span className="text-[9px] text-amber-500 font-extrabold">({qty})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add To Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || (hasSizes && isSelectedSizeSoldOut)}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 shadow-sm ${
              isOutOfStock || (hasSizes && isSelectedSizeSoldOut)
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
            ) : isOutOfStock || (hasSizes && isSelectedSizeSoldOut) ? (
              <span>Size Sold Out</span>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Multi-Photo Quick View Details Modal */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col justify-between overflow-y-auto">
            
            <button
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Gallery View Area */}
            <div className="space-y-2">
              <div className="relative w-full aspect-video rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                <img
                  src={activeModalImage}
                  alt={`${product.name} view ${activeImageIdx + 1}`}
                  className="w-full h-full object-contain"
                />

                {imageList.length > 1 && (
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between">
                    <button
                      type="button"
                      onClick={prevModalImage}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition shadow-md cursor-pointer"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextModalImage}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition shadow-md cursor-pointer"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails Row */}
              {imageList.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imageList.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                        activeImageIdx === idx
                          ? "border-emerald-500 scale-105 shadow-sm"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Summary Header */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                {product.category}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {product.name}
              </h2>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  KSH {Number(product.price).toLocaleString()}
                </p>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-xs text-slate-400 line-through font-medium">
                    KSH {Number(product.original_price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Sizes Picker with Live Stock Breakdown */}
            {hasSizes && (
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                  <span>Available Sizes:</span>
                  {selectedSize && (
                    <span
                      className={
                        selectedSizeQty > 0 ? "text-emerald-500 text-[11px]" : "text-rose-500 text-[11px]"
                      }
                    >
                      {selectedSizeQty > 0 ? `${selectedSizeQty} in stock` : "Selected size sold out"}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesList.map((size) => {
                    const qty = getSizeQuantity(size);
                    const isSoldOut = qty <= 0;
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isSoldOut}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                          isSoldOut
                            ? "opacity-35 bg-slate-100 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800 line-through cursor-not-allowed"
                            : isSelected
                            ? "bg-emerald-500 text-black border-emerald-500 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                        }`}
                      >
                        <span>Size {size}</span>
                        {!isSoldOut && (
                          <span className="text-[10px] opacity-75 font-semibold">({qty} left)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
              <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Product Details & Specifications
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description ||
                  "Authentic quality sporting gear verified by Elim Sports. Available for instant pickup at Moms & Dads Centre, Juja or campus/rider delivery."}
              </p>
            </div>

            {/* Smart Inventory Status Text */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <AlertCircle className="w-4 h-4 text-emerald-500" />
              <span>
                Inventory Status:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {isOutOfStock || (hasSizes && isSelectedSizeSoldOut)
                    ? "Out of Stock"
                    : hasSizes && selectedSize
                    ? `${selectedSizeQty} ${unitLabel} available in Size ${selectedSize}`
                    : `${totalStock} available in store`}
                </strong>
              </span>
            </div>

            {/* Dual Action Buttons: Add to Cart vs Direct Buy Now */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleAddToCart();
                  setIsDetailsOpen(false);
                }}
                disabled={isOutOfStock || (hasSizes && isSelectedSizeSoldOut)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isOutOfStock || (hasSizes && isSelectedSizeSoldOut) ? "Sold Out" : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock || (hasSizes && isSelectedSizeSoldOut)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>Buy It Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}