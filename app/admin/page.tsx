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
  Edit3,
  X,
} from "lucide-react";
import { Product } from "@/components/ProductCard";

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Free Size"];
const SHOE_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45", "46"];
const CATEGORIES = [
  "Footwear",
  "Jerseys & Kits",
  "Apparel & Gym",
  "Rackets & Paddles",
  "Accessories & Gear",
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Live Banner State
  const [bannerText, setBannerText] = useState("");
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerSavedStatus, setBannerSavedStatus] = useState(false);

  // Create Product Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Footwear");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("5");
  const [description, setDescription] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({});

  // Multi-Image Form State
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [urlInputs, setUrlInputs] = useState<string[]>([""]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    category: string;
    price: string;
    original_price: string;
    stock_quantity: string;
    description: string;
    available_sizes: string[];
    size_stocks: Record<string, number>;
    images: string[];
  }>({
    name: "",
    category: "Footwear",
    price: "",
    original_price: "",
    stock_quantity: "0",
    description: "",
    available_sizes: [],
    size_stocks: {},
    images: [""],
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Quick Stock Selector Modal State
  const [quickStockTarget, setQuickStockTarget] = useState<{
    product: Product;
    delta: number;
  } | null>(null);

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

  // Size toggle & per-size stock handler for Creation form
  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes((prev) => prev.filter((s) => s !== size));
      setSizeStocks((prev) => {
        const next = { ...prev };
        delete next[size];
        return next;
      });
    } else {
      setSelectedSizes((prev) => [...prev, size]);
      setSizeStocks((prev) => ({ ...prev, [size]: 1 }));
    }
  };

  const handleSizeStockChange = (size: string, qty: number) => {
    setSizeStocks((prev) => ({
      ...prev,
      [size]: Math.max(0, qty),
    }));
  };

  // Size toggle & per-size stock handler for Edit form
  const toggleEditSize = (size: string) => {
    setEditFormData((prev) => {
      const exists = prev.available_sizes.includes(size);
      const newSizes = exists
        ? prev.available_sizes.filter((s) => s !== size)
        : [...prev.available_sizes, size];

      const newStocks = { ...prev.size_stocks };
      if (exists) {
        delete newStocks[size];
      } else {
        newStocks[size] = 1;
      }

      return {
        ...prev,
        available_sizes: newSizes,
        size_stocks: newStocks,
      };
    });
  };

  const handleEditSizeStockChange = (size: string, qty: number) => {
    setEditFormData((prev) => ({
      ...prev,
      size_stocks: {
        ...prev.size_stocks,
        [size]: Math.max(0, qty),
      },
    }));
  };

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

  // Create Form Image Handling
  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 4 - selectedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);
    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...filesToAdd]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUrlChange = (index: number, val: string) => {
    const next = [...urlInputs];
    next[index] = val;
    setUrlInputs(next);
  };

  const addUrlSlot = () => {
    if (urlInputs.length < 4) setUrlInputs((prev) => [...prev, ""]);
  };

  const removeUrlSlot = (index: number) => {
    setUrlInputs((prev) => prev.filter((_, idx) => idx !== index));
  };

  async function uploadFilesToSupabase(files: File[]): Promise<string[]> {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw new Error("Upload error: " + uploadError.message);

      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);
    }
    return uploadedUrls;
  }

  // Handle Add Product
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setSubmitting(true);
    try {
      let finalImages: string[] = [];

      if (imageMode === "upload") {
        if (selectedFiles.length === 0) {
          alert("Please upload at least 1 photo for this product.");
          setSubmitting(false);
          return;
        }
        finalImages = await uploadFilesToSupabase(selectedFiles);
      } else {
        finalImages = urlInputs.map((u) => u.trim()).filter((u) => u.length > 0);
        if (finalImages.length === 0) {
          alert("Please provide at least 1 valid image URL.");
          setSubmitting(false);
          return;
        }
      }

      const calculatedQty = selectedSizes.length > 0
        ? Object.values(sizeStocks).reduce((a, b) => a + b, 0)
        : Math.max(0, parseInt(stockQuantity, 10) || 0);

      const regularPrice = originalPrice ? Number(originalPrice) : null;
      const primaryImage = finalImages[0];

      const { error: insertError } = await supabase.from("products").insert([
        {
          name: name.trim(),
          category,
          price: Number(price),
          original_price: regularPrice,
          stock_quantity: calculatedQty,
          size_stocks: sizeStocks,
          available_sizes: selectedSizes,
          image_url: primaryImage,
          images: finalImages,
          description: description.trim(),
          in_stock: calculatedQty > 0,
        },
      ]);

      if (insertError) throw new Error("Database insert error: " + insertError.message);

      setName("");
      setPrice("");
      setOriginalPrice("");
      setStockQuantity("5");
      setDescription("");
      setSelectedSizes([]);
      setSizeStocks({});
      setUrlInputs([""]);
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
      setSelectedFiles([]);
      setPreviewUrls([]);

      await loadProducts();
    } catch (err: any) {
      alert(err.message || "Failed to add equipment to catalog.");
    } finally {
      setSubmitting(false);
    }
  }

  // Quick Stock Stepper Logic (Checks for size variants)
  async function handleQuickStockClick(product: Product, delta: number) {
    const currentSizes = product.available_sizes || (product.size_stocks ? Object.keys(product.size_stocks) : []);

    if (currentSizes.length > 0) {
      setQuickStockTarget({ product, delta });
      return;
    }

    const currentQty = product.stock_quantity ?? (product.in_stock ? 1 : 0);
    const newQty = Math.max(0, currentQty + delta);
    const inStock = newQty > 0;

    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: newQty, in_stock: inStock })
      .eq("id", product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock_quantity: newQty, in_stock: inStock } : p
        )
      );
    }
  }

  // Applies size adjustment from the mini popup
  async function applySizeStockChange(selectedSize: string) {
    if (!quickStockTarget) return;
    const { product, delta } = quickStockTarget;

    const currentStocks: Record<string, number> = { ...(product.size_stocks || {}) };
    const currentSizeQty = currentStocks[selectedSize] ?? 1;
    const newSizeQty = Math.max(0, currentSizeQty + delta);

    currentStocks[selectedSize] = newSizeQty;
    const updatedTotalStock = Object.values(currentStocks).reduce((a, b) => a + b, 0);

    const { error } = await supabase
      .from("products")
      .update({
        size_stocks: currentStocks,
        stock_quantity: updatedTotalStock,
        in_stock: updatedTotalStock > 0,
      })
      .eq("id", product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                size_stocks: currentStocks,
                stock_quantity: updatedTotalStock,
                in_stock: updatedTotalStock > 0,
              }
            : p
        )
      );
    }

    setQuickStockTarget(null);
  }

  // Delete Product
  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      loadProducts();
    }
  }

  // Start Edit Mode
  const handleOpenEdit = (p: Product) => {
    const rawImages = (p.images && p.images.length > 0)
      ? p.images
      : p.image_url ? [p.image_url] : [""];

    const currentSizes = p.available_sizes || (p.size_stocks ? Object.keys(p.size_stocks) : []);
    
    const initialSizeStocks: Record<string, number> = {};
    currentSizes.forEach((sz) => {
      initialSizeStocks[sz] = p.size_stocks?.[sz] ?? (p.stock_quantity ? Math.floor(p.stock_quantity / currentSizes.length) || 1 : 1);
    });

    setEditFormData({
      name: p.name,
      category: p.category,
      price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : "",
      stock_quantity: String(p.stock_quantity ?? (p.in_stock ? 10 : 0)),
      description: p.description || "",
      available_sizes: currentSizes,
      size_stocks: p.size_stocks && Object.keys(p.size_stocks).length > 0 ? p.size_stocks : initialSizeStocks,
      images: rawImages,
    });
    setEditingProduct(p);
  };

  // Save Product Edits to Supabase
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingEdit(true);
    try {
      const cleanImages = editFormData.images.map((u) => u.trim()).filter((u) => u.length > 0);
      const primaryImage = cleanImages[0] || editingProduct.image_url || "/placeholder.png";

      const hasSizes = editFormData.available_sizes.length > 0;
      const totalQty = hasSizes
        ? Object.values(editFormData.size_stocks).reduce((a, b) => a + b, 0)
        : Math.max(0, parseInt(editFormData.stock_quantity, 10) || 0);

      const { error } = await supabase
        .from("products")
        .update({
          name: editFormData.name.trim(),
          category: editFormData.category,
          price: Number(editFormData.price),
          original_price: editFormData.original_price ? Number(editFormData.original_price) : null,
          stock_quantity: totalQty,
          size_stocks: editFormData.size_stocks,
          in_stock: totalQty > 0,
          description: editFormData.description.trim(),
          available_sizes: editFormData.available_sizes,
          images: cleanImages,
          image_url: primaryImage,
        })
        .eq("id", editingProduct.id);

      if (error) throw new Error("Update error: " + error.message);

      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || "Failed to update product.");
    } finally {
      setSavingEdit(false);
    }
  };

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

  const totalUnits = products.reduce(
    (acc, p) => acc + (p.stock_quantity ?? (p.in_stock ? 1 : 0)),
    0
  );
  const outOfStockCount = products.filter(
    (p) => (p.stock_quantity ?? (p.in_stock ? 1 : 0)) === 0
  ).length;

  const isFootwear = category.toLowerCase().includes("footwear") || category.toLowerCase().includes("boot");
  const isApparelOrJersey = 
    category.toLowerCase().includes("jersey") || 
    category.toLowerCase().includes("apparel") || 
    category.toLowerCase().includes("gym") ||
    category.toLowerCase().includes("kit");

  const isEditFootwear = editFormData.category.toLowerCase().includes("footwear") || editFormData.category.toLowerCase().includes("boot");
  const isEditApparelOrJersey = 
    editFormData.category.toLowerCase().includes("jersey") || 
    editFormData.category.toLowerCase().includes("apparel") || 
    editFormData.category.toLowerCase().includes("gym") ||
    editFormData.category.toLowerCase().includes("kit");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
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
                Elim Sports Inventory & Admin
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage per-size quantities, multi-photo angles, discounts, and active listings
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

        {/* Live Banner Editor */}
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
              placeholder="e.g. Football boots and badminton rackets available at Moms & Dads Juja"
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
              Add Product & Set Sizes
            </h2>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Equipment / Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kawasaki Badminton Shoes"
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
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSelectedSizes([]);
                      setSizeStocks({});
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition font-medium"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {selectedSizes.length > 0 ? "Total Stock (Auto-Sum)" : "Stock Quantity"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    disabled={selectedSizes.length > 0}
                    value={selectedSizes.length > 0 ? Object.values(sizeStocks).reduce((a, b) => a + b, 0) : stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 transition disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Price Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Sale Price (KSH) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1600"
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
                    placeholder="Optional discount"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* SIZES SELECTOR & EXACT QUANTITY BREAKDOWN */}
              {(isFootwear || isApparelOrJersey) && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs">
                      Available Sizes & Pairs per Size:
                    </label>
                    {selectedSizes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSizes([]);
                          setSizeStocks({});
                        }}
                        className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(isFootwear ? SHOE_SIZES : APPAREL_SIZES).map((sz) => {
                      const isSelected = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSize(sz)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-emerald-500 text-black shadow-sm ring-2 ring-emerald-400"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>

                  {selectedSizes.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Set stock count for each size:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedSizes.map((sz) => (
                          <div key={sz} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Size {sz}:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={sizeStocks[sz] ?? 1}
                                onChange={(e) => handleSizeStockChange(sz, parseInt(e.target.value, 10) || 0)}
                                className="w-12 text-center text-xs font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-1 text-emerald-600 dark:text-emerald-400 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">prs</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Image Source Selection */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-semibold">
                  Product Photos (Up to 4 angles)
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
                    <span>Upload ({selectedFiles.length}/4)</span>
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
                    <span>Web Links</span>
                  </button>
                </div>

                {imageMode === "upload" ? (
                  <div className="space-y-3">
                    {previewUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {previewUrls.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                            <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(idx)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 text-white shadow cursor-pointer active:scale-90"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedFiles.length < 4 && (
                      <div className="grid grid-cols-2 gap-2.5">
                        <label
                          htmlFor="gallery-upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950 transition text-center group"
                        >
                          <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition mb-1" />
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            Add from Gallery
                          </span>
                          <input
                            id="gallery-upload"
                            ref={galleryInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFilesSelect}
                            className="sr-only"
                          />
                        </label>

                        <label
                          htmlFor="camera-snap"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950 transition text-center group"
                        >
                          <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition mb-1" />
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            Snap Photo
                          </span>
                          <input
                            id="camera-snap"
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFilesSelect}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {urlInputs.map((url, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="url"
                          placeholder={`Photo URL #${idx + 1}`}
                          value={url}
                          onChange={(e) => handleUrlChange(idx, e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition text-xs"
                        />
                        {urlInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUrlSlot(idx)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {urlInputs.length < 4 && (
                      <button
                        type="button"
                        onClick={addUrlSlot}
                        className="text-emerald-500 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Another URL
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Specs & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Material, string tension, fit details..."
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
                  const photoCount = (p.images && p.images.length > 0) ? p.images.length : (p.image_url ? 1 : 0);

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 gap-3 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                          <img
                            src={(p.images && p.images[0]) || p.image_url || "/placeholder.png"}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          {photoCount > 1 && (
                            <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                              {photoCount}📷
                            </span>
                          )}
                        </div>

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

                          {p.available_sizes && p.available_sizes.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[9px] text-slate-400">Sizes:</span>
                              <div className="flex gap-1 flex-wrap">
                                {p.available_sizes.map((sz) => {
                                  const sizeStock = p.size_stocks?.[sz];
                                  return (
                                    <span
                                      key={sz}
                                      className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                                        sizeStock === 0
                                          ? "bg-rose-100 dark:bg-rose-950 text-rose-500 line-through"
                                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      {sz} {sizeStock !== undefined && `(${sizeStock})`}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-200 dark:border-slate-800">
                        {/* Quick Stock Controls */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleQuickStockClick(p, -1)}
                            disabled={qty === 0}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition"
                            title="Decrease Stock"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span
                            className={`px-1.5 text-xs font-black min-w-[2.5rem] text-center ${
                              isOutOfStock
                                ? "text-rose-500"
                                : isLowStock
                                ? "text-amber-500"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {qty}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuickStockClick(p, 1)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition"
                            title="Increase Stock"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-black text-slate-600 dark:text-slate-300 transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Edit Details & Photos"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
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

      {/* Quick Size Selection Mini-Modal */}
      {quickStockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {quickStockTarget.delta > 0 ? "Add +1 Pair to Size" : "Remove -1 Pair from Size"}
                </h3>
                <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                  {quickStockTarget.product.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickStockTarget(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Select which size to {quickStockTarget.delta > 0 ? "increase" : "decrease"}:
              </p>

              <div className="grid grid-cols-3 gap-2">
                {(
                  quickStockTarget.product.available_sizes ||
                  (quickStockTarget.product.size_stocks ? Object.keys(quickStockTarget.product.size_stocks) : [])
                ).map((sz) => {
                  const currentCount = quickStockTarget.product.size_stocks?.[sz] ?? 0;
                  const isButtonDisabled = quickStockTarget.delta < 0 && currentCount <= 0;

                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={isButtonDisabled}
                      onClick={() => applySizeStockChange(sz)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500 hover:text-black dark:hover:bg-emerald-500 dark:hover:text-black transition flex flex-col items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-black">
                        Size {sz}
                      </span>
                      <span className="text-[10px] text-slate-500 group-hover:text-black font-semibold">
                        ({currentCount} currently)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-500" />
                Edit Product: {editingProduct.name}
              </h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Category
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {editFormData.available_sizes.length > 0 ? "Total Stock (Auto-Sum)" : "Stock Units"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    disabled={editFormData.available_sizes.length > 0}
                    value={
                      editFormData.available_sizes.length > 0
                        ? Object.values(editFormData.size_stocks).reduce((a, b) => a + b, 0)
                        : editFormData.stock_quantity
                    }
                    onChange={(e) => setEditFormData({ ...editFormData, stock_quantity: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Sale Price (KSH)
                  </label>
                  <input
                    type="number"
                    required
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-emerald-600 dark:text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Regular Price (KSH)
                  </label>
                  <input
                    type="number"
                    value={editFormData.original_price}
                    onChange={(e) => setEditFormData({ ...editFormData, original_price: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Edit Available Sizes & Size Quantities */}
              {(isEditFootwear || isEditApparelOrJersey) && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Edit Sizes & Stock Breakdown:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(isEditFootwear ? SHOE_SIZES : APPAREL_SIZES).map((sz) => {
                      const isSelected = editFormData.available_sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleEditSize(sz)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-500 text-black ring-2 ring-emerald-400"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>

                  {editFormData.available_sizes.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Edit Pairs per Size:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {editFormData.available_sizes.map((sz) => (
                          <div key={sz} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Size {sz}:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={editFormData.size_stocks[sz] ?? 1}
                                onChange={(e) => handleEditSizeStockChange(sz, parseInt(e.target.value, 10) || 0)}
                                className="w-12 text-center text-xs font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-1 text-emerald-600 dark:text-emerald-400 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">prs</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Photo URLs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                    Photo URLs (Up to 4)
                  </label>
                  {editFormData.images.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, images: [...editFormData.images, ""] })}
                      className="text-emerald-500 font-bold hover:underline cursor-pointer"
                    >
                      + Add URL
                    </button>
                  )}
                </div>

                {editFormData.images.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        const next = [...editFormData.images];
                        next[idx] = e.target.value;
                        setEditFormData({ ...editFormData, images: next });
                      }}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs"
                      placeholder={`Photo URL #${idx + 1}`}
                    />
                    {editFormData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            images: editFormData.images.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Specs & Description
                </label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                {savingEdit ? "Saving Updates..." : "Save Product Updates"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}