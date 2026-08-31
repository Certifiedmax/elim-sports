"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Minus,
  Package,
  Camera,
  Link as LinkIcon,
  UploadCloud,
  AlertTriangle,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  Megaphone,
  Tag,
  Save,
  RotateCcw,
} from "lucide-react";
import { Product } from "@/components/ProductCard";

export default function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Inventory State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Banner Announcement Ticker State
  const [bannerText, setBannerText] = useState("");
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerSavedStatus, setBannerSavedStatus] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Badminton");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("5");
  const [description, setDescription] = useState("");

  // Image Source Switcher
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("elim_admin_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadBannerText();
    }
  }, [isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = process.env.NEXT_PUBLIC_ADMIN_PIN || "2540";

    if (pinInput === correctPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem("elim_admin_auth", "true");
      setPinError(false);
      setPinInput("");
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("elim_admin_auth");
    setIsAuthenticated(false);
  };

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }

  async function loadBannerText() {
    const { data } = await supabase
      .from("store_settings")
      .select("banner_text")
      .eq("id", "promo_banner")
      .single();

    if (data && data.banner_text) {
      setBannerText(data.banner_text);
    }
  }

  async function handleSaveBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!bannerText.trim()) return;

    setSavingBanner(true);
    const { error } = await supabase
      .from("store_settings")
      .upsert({ id: "promo_banner", banner_text: bannerText.trim(), updated_at: new Date() });

    if (!error) {
      setBannerSavedStatus(true);
      setTimeout(() => setBannerSavedStatus(false), 3000);
    } else {
      alert("Error saving banner: " + error.message);
    }
    setSavingBanner(false);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke old preview to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;

    let finalImageUrl = imageUrl.trim();
    setSubmitting(true);

    try {
      if (imageMode === "upload") {
        if (!selectedFile) {
          alert("Please select a photo from your gallery or take one using the camera.");
          setSubmitting(false);
          return;
        }

        const fileExt = selectedFile.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error("Image upload error: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      } else {
        if (!finalImageUrl) {
          alert("Please provide a valid image link.");
          setSubmitting(false);
          return;
        }
      }

      const qty = Math.max(0, parseInt(stockQuantity, 10) || 0);
      const regularPrice = originalPrice ? Number(originalPrice) : null;

      const { error: insertError } = await supabase.from("products").insert([
        {
          name: name.trim(),
          category,
          price: Number(price),
          original_price: regularPrice,
          stock_quantity: qty,
          image_url: finalImageUrl,
          description: description.trim(),
          in_stock: qty > 0,
        },
      ]);

      if (insertError) {
        throw new Error("Database insert error: " + insertError.message);
      }

      // Cleanup and Reset Form
      setName("");
      setPrice("");
      setOriginalPrice("");
      setStockQuantity("5");
      setImageUrl("");
      setDescription("");
      handleClearSelectedFile();

      await loadProducts();
    } catch (err: any) {
      alert(err.message || "Failed to add equipment to catalog.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStock(id: string, currentQty: number, delta: number) {
    const newQty = Math.max(0, (currentQty || 0) + delta);
    const inStock = newQty > 0;

    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: newQty, in_stock: inStock })
      .eq("id", id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stock_quantity: newQty, in_stock: inStock } : p
        )
      );
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this equipment?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      loadProducts();
    }
  }

  // --- PIN ACCESS GATE SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Elim Sports Owner Portal
            </h1>
            <p className="text-xs text-slate-400">
              Enter the 4-digit security PIN to manage store inventory & offers
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="• • • •"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  className={`w-full bg-slate-950 border text-center tracking-[0.6em] text-lg font-mono rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none transition ${
                    pinError
                      ? "border-rose-500 focus:border-rose-500 text-rose-300"
                      : "border-slate-800 focus:border-emerald-500"
                  }`}
                />
              </div>
              {pinError && (
                <p className="text-rose-400 text-[11px] font-semibold mt-2 text-center">
                  Incorrect PIN. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition shadow-md cursor-pointer active:scale-98 flex items-center justify-center gap-2 text-xs"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Dashboard</span>
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- UNLOCKED ADMIN DASHBOARD ---
  const totalUnits = products.reduce(
    (acc, p) => acc + (p.stock_quantity ?? (p.in_stock ? 1 : 0)),
    0
  );
  const outOfStockCount = products.filter(
    (p) => (p.stock_quantity ?? (p.in_stock ? 1 : 0)) === 0
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header & Dashboard Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition shadow-sm"
              title="Return to Storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Elim Sports Inventory & Offers
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track exact stock quantities, set sale discounts, and edit the moving ticker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
              <span className="text-slate-500 dark:text-slate-400">Total Units: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-black">{totalUnits}</strong>
            </div>

            {outOfStockCount > 0 ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{outOfStockCount} Out of Stock</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>All Stock Healthy</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 transition shadow-sm cursor-pointer"
              title="Lock Admin Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Moving Announcement Ticker Editor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Live Homepage Moving Ticker Announcement
            </h2>
            {bannerSavedStatus && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Updated Live on Storefront!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBanner} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. Running Shoes Offer: From KSH 1,650/= | Stringing available this weekend at Moms & Dads"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition font-medium"
            />
            <button
              type="submit"
              disabled={savingBanner}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-sm transition cursor-pointer shrink-0 active:scale-98"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingBanner ? "Saving..." : "Update Live Banner"}</span>
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Product Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 h-fit space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Add Inventory Item & Set Sale Price
            </h2>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Equipment / Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yonex Astrox 7DG Racket"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Badminton">Badminton</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Price & Optional Offer Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Sale Price (KSH) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 6500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-rose-500" />
                    Regular Price (KSH)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional (e.g. 7500)"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Image Source Selection */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-semibold">
                  Image Source
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setImageMode("upload")}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      imageMode === "upload"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      imageMode === "url"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Web Link</span>
                  </button>
                </div>

                {imageMode === "upload" ? (
                  <div className="space-y-3">
                    {previewUrl ? (
                      /* Image Preview Container with Remove Action */
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 group">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        {/* Hover Overlay Button */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                          <button
                            type="button"
                            onClick={handleClearSelectedFile}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove & Pick Another</span>
                          </button>
                        </div>
                        {/* Mobile Direct Action Button */}
                        <button
                          type="button"
                          onClick={handleClearSelectedFile}
                          aria-label="Remove image"
                          className="sm:hidden absolute top-2 right-2 p-2 rounded-xl bg-rose-600 text-white shadow-md cursor-pointer active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      /* Dual Option Picker: Gallery vs Direct Camera */
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Option 1: Gallery / Files */}
                        <label
                          htmlFor="gallery-upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950 transition text-center group"
                        >
                          <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition mb-1" />
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            Photo Gallery
                          </span>
                          <span className="text-[9px] text-slate-400">Browse files</span>
                          <input
                            id="gallery-upload"
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>

                        {/* Option 2: Direct Camera Snap */}
                        <label
                          htmlFor="camera-snap"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950 transition text-center group"
                        >
                          <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition mb-1" />
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            Take Photo
                          </span>
                          <span className="text-[9px] text-slate-400">Launch camera</span>
                          <input
                            id="camera-snap"
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Specs & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Material, string tension, size range..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {submitting ? "Publishing Item..." : "Publish to Shop"}
              </button>
            </form>
          </div>

          {/* Active Inventory List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Active Shop Inventory ({products.length})
            </h2>

            {loading ? (
              <p className="text-xs text-slate-500">Loading catalog items...</p>
            ) : products.length === 0 ? (
              <p className="text-xs text-slate-500">No items found in your database.</p>
            ) : (
              <div className="space-y-3">
                {products.map((p) => {
                  const qty = p.stock_quantity ?? (p.in_stock ? 1 : 0);
                  const isOutOfStock = qty === 0;
                  const isLowStock = qty > 0 && qty <= 2;
                  const hasDiscount = p.original_price && Number(p.original_price) > Number(p.price);

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 gap-3 transition"
                    >
                      {/* Product Preview */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 dark:text-white text-xs block truncate">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                              KSH {Number(p.price).toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-slate-400 line-through">
                                KSH {Number(p.original_price).toLocaleString()}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
                              {p.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Stock Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateStock(p.id, qty, -1)}
                            disabled={qty === 0}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition"
                            title="Decrease Stock"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span
                            className={`px-2 text-xs font-black min-w-[3rem] text-center ${
                              isOutOfStock
                                ? "text-rose-500"
                                : isLowStock
                                ? "text-amber-500"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {qty} {qty === 1 ? "unit" : "units"}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateStock(p.id, qty, 1)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition"
                            title="Increase Stock"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Badges */}
                        <div className="min-w-[75px] text-right">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              Sold Out
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              In Stock
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteProduct(p.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Delete equipment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}