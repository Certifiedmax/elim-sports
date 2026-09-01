"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard, { Product } from "@/components/ProductCard";
import LiveChatWidget from "@/components/LiveChatWidget";
import { Flame, Search, SlidersHorizontal, X, Tag } from "lucide-react";

const CATEGORIES = [
  "All",
  "Footwear",
  "Rackets & Paddles",
  "Jerseys & Kits",
  "Apparel & Gym",
  "Accessories & Gear",
] as const;

type SortOption = "featured" | "price-asc" | "price-desc" | "in-stock" | "discount";

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [loading, setLoading] = useState(true);
  const [bannerText, setBannerText] = useState<string | null>(null);

  // Reusable Catalog Fetcher
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase products fetch error:", error);
      } else if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }, []);

  // Reusable Banner Fetcher
  const fetchBanner = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("banner_text")
        .eq("id", "promo_banner")
        .maybeSingle();

      if (error) {
        console.error("Supabase banner fetch error:", error);
      }

      if (data && data.banner_text) {
        setBannerText(data.banner_text);
      } else {
        setBannerText(
          "🔥 Special Offers: Football boots & running shoes from KSH 1,650/= | Stringing available at Moms & Dads Juja | Fast delivery available"
        );
      }
    } catch (err) {
      console.error("Failed to load banner:", err);
      setBannerText(
        "🔥 Special Offers: Football boots & running shoes from KSH 1,650/= | Stringing available at Moms & Dads Juja | Fast delivery available"
      );
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initializeCatalog() {
      await Promise.all([fetchProducts(), fetchBanner()]);
      if (isMounted) setLoading(false);
    }

    initializeCatalog();

    // 1. Real-time Subscription for Live Stock & Inventory Changes
    const productChannel = supabase
      .channel("realtime-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    // 2. Real-time Subscription for Announcement Banner Changes
    const bannerChannel = supabase
      .channel("realtime-banner")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings" },
        () => {
          fetchBanner();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(productChannel);
      supabase.removeChannel(bannerChannel);
    };
  }, [fetchProducts, fetchBanner]);

  // Filter & Sort Pipeline (Matches Name, Category, Description, and Available Sizes)
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === "All" || product.category === selectedCategory;

        const q = searchQuery.toLowerCase().trim();
        const matchesSizes =
          product.available_sizes &&
          product.available_sizes.some((sz) => sz.toLowerCase() === q);

        const matchesSearch =
          !q ||
          product.name.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          (product.description && product.description.toLowerCase().includes(q)) ||
          matchesSizes;

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
        if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
        if (sortBy === "in-stock") {
          const aStock = a.stock_quantity ?? (a.in_stock ? 1 : 0);
          const bStock = b.stock_quantity ?? (b.in_stock ? 1 : 0);
          return bStock - aStock;
        }
        if (sortBy === "discount") {
          const aDisc = (a.original_price ?? 0) - Number(a.price);
          const bDisc = (b.original_price ?? 0) - Number(b.price);
          return bDisc - aDisc;
        }
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between overflow-hidden transition-colors duration-300">
      {/* Background Watermark */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-0 overflow-hidden select-none">
        <img
          src="/Elim Sports logo.png"
          alt="Elim Sports Watermark"
          className="w-[550px] md:w-[750px] opacity-[0.04] dark:opacity-[0.035] filter grayscale brightness-125 dark:brightness-150 rotate-[-12deg]"
        />
      </div>

      <div className="relative z-10 flex-1">
        <Navbar />

        {/* Live Moving Announcement Ticker Bar */}
        <div className="bg-emerald-500 text-black h-8 overflow-hidden select-none relative shadow-sm border-b border-emerald-600/30 flex items-center">
          {bannerText ? (
            <div className="animate-marquee whitespace-nowrap flex items-center text-xs font-black tracking-wide uppercase">
              <span className="mx-6 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 fill-black shrink-0" /> {bannerText}
              </span>
              <span className="mx-6 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 fill-black shrink-0" /> {bannerText}
              </span>
              <span className="mx-6 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 fill-black shrink-0" /> {bannerText}
              </span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                Loading latest offers...
              </span>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-100 dark:from-slate-900/60 dark:to-slate-950/90 py-10 sm:py-14 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Authentic Boots, Rackets, Jerseys & Gym Wear
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Gear Up With Pro Sportswear & Equipment
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Football boots, running shoes, rackets (badminton, tennis, pickleball), team jerseys, gym tights, and tracksuits at Elim Sports in Juja.
            </p>

            {/* Live Search Input Box */}
            <div className="pt-2 max-w-md mx-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search boots, rackets, jerseys, tracksuits, sizes (e.g. XL, 42)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-10 text-xs text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Filter, Sort & Catalog Grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown & Count Indicator */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort products"
                  className="bg-transparent text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured / Latest</option>
                  <option value="discount">Biggest Offers (-% OFF)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="in-stock">Available First</option>
                </select>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-900/60 animate-pulse border border-slate-300 dark:border-slate-800"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-8 space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No matching gear found for &ldquo;{searchQuery || selectedCategory}&rdquo;
              </p>
              <p className="text-xs text-slate-500">
                Try clearing your search term or checking another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-2 inline-block cursor-pointer"
              >
                Reset all filters →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>

      <LiveChatWidget />
    </div>
  );
}