"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { restoreOrderStock, deductOrderStock } from "@/lib/stockHelper";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Minus,
  Package,
  Camera,
  Link as LinkIcon,
  UploadCloud,
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
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Phone,
  MapPin,
  RefreshCw,
  Layers,
  XCircle,
  FileDown,
  Archive,
  RotateCcw,
  Calendar,
  AlertTriangle,
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

const BRANDS = ["Yonex", "Nike", "Adidas", "Kawasaki", "Li-Ning", "Puma", "Generic / Other"];

const BADGES = [
  { label: "None", value: "None" },
  { label: "🔥 Bestseller", value: "Bestseller" },
  { label: "✨ New Drop", value: "New Drop" },
  { label: "⚡ Low Stock", value: "Low Stock" },
  { label: "🏆 Pro Grade", value: "Pro Grade" },
];

interface OrderItem {
  product_id: string;
  name: string;
  category?: string;
  size?: string;
  quantity: number;
  price: number;
  cost_price?: number;
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone?: string;
  fulfillment_method: string;
  delivery_notes?: string;
  items: OrderItem[];
  total_amount: number;
  status: "pending" | "completed" | "cancelled";
  is_archived?: boolean;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Tab View: "orders" | "inventory"
  const [activeTab, setActiveTab] = useState<"orders" | "inventory">("orders");

  // Orders State & Filters
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [orderViewScope, setOrderViewScope] = useState<"active" | "archived" | "cancelled">("active");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Inventory State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Live Banner State
  const [bannerText, setBannerText] = useState("");
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerSavedStatus, setBannerSavedStatus] = useState(false);

  // Create Product Form State
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("Yonex");
  const [category, setCategory] = useState("Footwear");
  const [costPrice, setCostPrice] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [badge, setBadge] = useState("None");
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
    brand: string;
    category: string;
    cost_price: string;
    price: string;
    original_price: string;
    badge: string;
    stock_quantity: string;
    description: string;
    available_sizes: string[];
    size_stocks: Record<string, number>;
    images: string[];
  }>({
    name: "",
    brand: "Yonex",
    category: "Footwear",
    cost_price: "",
    price: "",
    original_price: "",
    badge: "None",
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

  // Live profit margin calculation for create form
  const liveMargin = useMemo(() => {
    const selling = Number(price) || 0;
    const cost = Number(costPrice) || 0;
    if (!selling || !cost || selling <= cost) return null;

    const profit = selling - cost;
    const percentage = ((profit / selling) * 100).toFixed(1);
    return { profit, percentage };
  }, [price, costPrice]);

  useEffect(() => {
    async function checkServerAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkServerAuth();
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }, []);

  const loadBannerText = useCallback(async () => {
    const { data } = await supabase
      .from("store_settings")
      .select("banner_text")
      .eq("id", "promo_banner")
      .single();

    if (data && data.banner_text) {
      setBannerText(data.banner_text);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading orders:", error);
      } else if (data) {
        setOrders(data as Order[]);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadBannerText();
      fetchOrders();

      const ordersChannel = supabase
        .channel("realtime-admin-orders-tab")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [isAuthenticated, loadProducts, loadBannerText, fetchOrders]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setPinInput("");
        fetchOrders();
        loadProducts();
      } else {
        setPinError(true);
        setPinInput("");
      }
    } catch {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } finally {
      setIsAuthenticated(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    nextStatus: "pending" | "completed" | "cancelled"
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const targetOrder = orders.find((o) => o.id === orderId);

      if (targetOrder) {
        if (nextStatus === "cancelled" && targetOrder.status !== "cancelled") {
          await restoreOrderStock(targetOrder.items);
        }
        if (targetOrder.status === "cancelled" && nextStatus !== "cancelled") {
          await deductOrderStock(targetOrder.items);
        }
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", orderId);

      if (error) throw error;
      await Promise.all([fetchOrders(), loadProducts()]);
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Could not update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const toggleArchiveOrder = async (orderId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ is_archived: isArchived })
        .eq("id", orderId);

      if (error) throw error;
      await fetchOrders();
    } catch (err) {
      console.error("Failed to update archive status:", err);
      alert("Could not update archive state.");
    }
  };

  const archiveAllCompleted = async () => {
    const completedIds = orders
      .filter((o) => o.status === "completed" && !o.is_archived)
      .map((o) => o.id);

    if (completedIds.length === 0) {
      alert("No active completed orders to clear.");
      return;
    }

    if (
      !confirm(
        `Archive and clear ${completedIds.length} completed order(s) from the active board?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({ is_archived: true })
        .in("id", completedIds);

      if (error) throw error;
      await fetchOrders();
    } catch (err) {
      console.error("Failed to archive completed orders:", err);
      alert("Could not clear completed orders.");
    }
  };

  const dismissAllCancelled = async () => {
    const cancelledIds = orders
      .filter((o) => o.status === "cancelled" && !o.is_archived)
      .map((o) => o.id);

    if (cancelledIds.length === 0) {
      alert("No active cancelled orders to clear.");
      return;
    }

    if (
      !confirm(
        `Move ${cancelledIds.length} cancelled order(s) to the Cancelled Space?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({ is_archived: true })
        .in("id", cancelledIds);

      if (error) throw error;
      await fetchOrders();
    } catch (err) {
      console.error("Failed to dismiss cancelled orders:", err);
      alert("Could not clear cancelled orders.");
    }
  };

  const handleResetLedgerToZero = async () => {
    const confirmation = prompt(
      "PERMANENT ACTION: To delete all test sales and reset your metrics to KSH 0, type 'RESET' below:"
    );

    if (confirmation !== "RESET") {
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      await fetchOrders();
      alert("Store ledger has been reset to zero successfully!");
    } catch (err: any) {
      console.error("Failed to reset ledger:", err);
      alert(err.message || "Failed to wipe orders.");
    } finally {
      setIsResetting(false);
    }
  };

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    orders.forEach((o) => {
      const date = new Date(o.created_at);
      if (!isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthSet.add(key);
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [orders]);

  const ordersInSelectedPeriod = useMemo(() => {
    if (selectedMonth === "ALL") return orders;
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === selectedMonth;
    });
  }, [orders, selectedMonth]);

  // Exact Cost-Based Financial Analytics Calculations with safe fallback for legacy orders
  const analytics = useMemo(() => {
    const completedOrders = ordersInSelectedPeriod.filter((o) => o.status === "completed");
    const pendingOrders = ordersInSelectedPeriod.filter((o) => o.status === "pending");

    const grossRevenue = completedOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);

    // Exact Net Profit calculation with fallback estimation for older legacy items missing cost_price
    const exactNetProfit = completedOrders.reduce((acc, order) => {
      const orderProfit = order.items?.reduce((itemAcc, item) => {
        const itemSellingPrice = Number(item.price) || 0;
        const itemCostPrice = item.cost_price !== undefined && item.cost_price !== null
          ? Number(item.cost_price)
          : itemSellingPrice * 0.65; // Safe fallback for unassigned historical items
        const qty = Number(item.quantity) || 1;
        return itemAcc + (itemSellingPrice - itemCostPrice) * qty;
      }, 0) || 0;
      return acc + orderProfit;
    }, 0);

    const totalUnitsSold = completedOrders.reduce((acc, o) => {
      const unitsInOrder = o.items?.reduce((uSum, item) => uSum + (item.quantity || 1), 0) || 0;
      return acc + unitsInOrder;
    }, 0);

    const allTimeCompleted = orders.filter((o) => o.status === "completed");
    const allTimeGross = allTimeCompleted.reduce((acc, o) => acc + Number(o.total_amount), 0);

    return {
      grossRevenue,
      exactNetProfit,
      completedCount: completedOrders.length,
      pendingCount: pendingOrders.length,
      totalUnitsSold,
      allTimeGross,
    };
  }, [ordersInSelectedPeriod, orders]);

  const displayedOrders = useMemo(() => {
    return ordersInSelectedPeriod.filter((o) => {
      if (orderViewScope === "cancelled") {
        return o.status === "cancelled";
      }
      if (orderViewScope === "archived") {
        return o.status === "completed" && !!o.is_archived;
      }
      return !o.is_archived && o.status !== "cancelled";
    });
  }, [ordersInSelectedPeriod, orderViewScope]);

  const generateSalesPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF();
      const monthLabel =
        selectedMonth === "ALL"
          ? "All-Time Statement"
          : new Date(`${selectedMonth}-01`).toLocaleDateString("en-KE", {
              month: "long",
              year: "numeric",
            });

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 38, "F");

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ELIM SPORTS JUJA", 14, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Moms & Dads Centre, Juja | Phone: +254 796 757 424", 14, 23);
      doc.text(`Official Sales Ledger Report • ${monthLabel}`, 14, 30);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("FINANCIAL OVERVIEW", 14, 48);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Period Scope: ${monthLabel}`, 14, 55);
      doc.text(`Gross Revenue (Fulfilled): KSH ${analytics.grossRevenue.toLocaleString()}`, 14, 61);
      doc.text(
        `Net Profit (Exact Cost): KSH ${analytics.exactNetProfit.toLocaleString()}`,
        14,
        67
      );
      doc.text(`Total Units Dispatched: ${analytics.totalUnitsSold} items`, 120, 55);
      doc.text(`Fulfilled Orders Count: ${analytics.completedCount}`, 120, 61);
      doc.text(`Generated On: ${new Date().toLocaleString("en-KE")}`, 120, 67);

      const tableRows = ordersInSelectedPeriod.map((o) => {
        const itemSummaries =
          o.items
            ?.map((i) => `${i.quantity}x ${i.name}${i.size ? ` (Sz: ${i.size})` : ""}`)
            .join(", ") || "No items listed";

        const orderDate = new Date(o.created_at).toLocaleDateString("en-KE", {
          dateStyle: "short",
        });

        return [
          orderDate,
          `${o.customer_name}\n${o.customer_phone || ""}`.trim(),
          itemSummaries,
          o.fulfillment_method,
          `KSH ${Number(o.total_amount).toLocaleString()}`,
          o.status.toUpperCase(),
        ];
      });

      autoTable(doc, {
        startY: 74,
        margin: { left: 14, right: 14 },
        head: [["Date", "Customer", "Items & Sizes", "Fulfillment", "Amount", "Status"]],
        body: tableRows,
        theme: "plain",
        styles: {
          fontSize: 7.5,
          cellPadding: 3,
          valign: "middle",
          textColor: [51, 65, 85],
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 32 },
          2: { cellWidth: "auto" },
          3: { cellWidth: 42 },
          4: { cellWidth: 24, fontStyle: "bold" },
          5: {
            cellWidth: 26,
            halign: "center",
            fontSize: 7,
            fontStyle: "bold",
          },
        },
      });

      const cleanMonthName = selectedMonth === "ALL" ? "All_Time" : selectedMonth;
      doc.save(`Elim_Sports_Sales_Report_${cleanMonthName}.pdf`);

      if (orderViewScope === "active" && analytics.completedCount > 0) {
        setTimeout(() => {
          if (
            confirm(
              "PDF report downloaded! Would you like to clear and archive fulfilled orders from the active view now?"
            )
          ) {
            archiveAllCompleted();
          }
        }, 500);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to export PDF report.");
    } finally {
      setIsExportingPdf(false);
    }
  };

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

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price || !costPrice) return;

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

      const calculatedQty =
        selectedSizes.length > 0
          ? Object.values(sizeStocks).reduce((a, b) => a + b, 0)
          : Math.max(0, parseInt(stockQuantity, 10) || 0);

      const regularPrice = originalPrice ? Number(originalPrice) : null;
      const primaryImage = finalImages[0];

      const { error: insertError } = await supabase.from("products").insert([
        {
          name: name.trim(),
          brand: brand === "Generic / Other" ? null : brand,
          category,
          price: Number(price),
          original_price: regularPrice,
          cost_price: Number(costPrice),
          badge: badge === "None" ? null : badge,
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
      setBrand("Yonex");
      setCostPrice("");
      setBadge("None");
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

  async function handleQuickStockClick(product: Product, delta: number) {
    const currentSizes =
      product.available_sizes || (product.size_stocks ? Object.keys(product.size_stocks) : []);

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

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      loadProducts();
    }
  }

  const handleOpenEdit = (p: Product) => {
    const rawImages =
      p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [""];

    const currentSizes =
      p.available_sizes || (p.size_stocks ? Object.keys(p.size_stocks) : []);

    const initialSizeStocks: Record<string, number> = {};
    currentSizes.forEach((sz) => {
      initialSizeStocks[sz] =
        p.size_stocks?.[sz] ??
        (p.stock_quantity ? Math.floor(p.stock_quantity / currentSizes.length) || 1 : 1);
    });

    setEditFormData({
      name: p.name,
      brand: (p as any).brand || "Yonex",
      category: p.category,
      cost_price: (p as any).cost_price ? String((p as any).cost_price) : "",
      price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : "",
      badge: (p as any).badge || "None",
      stock_quantity: String(p.stock_quantity ?? (p.in_stock ? 10 : 0)),
      description: p.description || "",
      available_sizes: currentSizes,
      size_stocks:
        p.size_stocks && Object.keys(p.size_stocks).length > 0 ? p.size_stocks : initialSizeStocks,
      images: rawImages,
    });
    setEditingProduct(p);
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editFormData.cost_price) return;

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
          brand: editFormData.brand === "Generic / Other" ? null : editFormData.brand,
          category: editFormData.category,
          cost_price: Number(editFormData.cost_price),
          price: Number(editFormData.price),
          original_price: editFormData.original_price ? Number(editFormData.original_price) : null,
          badge: editFormData.badge === "None" ? null : editFormData.badge,
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
              Enter the 4-digit security PIN to manage store inventory & sales
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

  const isFootwear =
    category.toLowerCase().includes("footwear") || category.toLowerCase().includes("boot");
  const isApparelOrJersey =
    category.toLowerCase().includes("jersey") ||
    category.toLowerCase().includes("apparel") ||
    category.toLowerCase().includes("gym") ||
    category.toLowerCase().includes("kit");

  const isEditFootwear =
    editFormData.category.toLowerCase().includes("footwear") ||
    editFormData.category.toLowerCase().includes("boot");
  const isEditApparelOrJersey =
    editFormData.category.toLowerCase().includes("jersey") ||
    editFormData.category.toLowerCase().includes("apparel") ||
    editFormData.category.toLowerCase().includes("gym") ||
    editFormData.category.toLowerCase().includes("kit");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition shadow-sm"
              title="Return to Storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Elim Sports Business Portal
              </h1>
              <p className="text-xs text-slate-400">
                Juja Moms & Dads Centre • Live Financials, Orders & Inventory
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Monthly Analytics Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 font-semibold">Period:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Filter ledger period"
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">
                  All-Time Summary
                </option>
                {availableMonths.map((mKey) => {
                  const d = new Date(`${mKey}-01`);
                  const label = d.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
                  return (
                    <option key={mKey} value={mKey} className="bg-slate-900">
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* In-Dashboard Wipe All Orders Button */}
            <button
              type="button"
              disabled={isResetting || orders.length === 0}
              onClick={handleResetLedgerToZero}
              className="p-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-400 hover:text-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              title="Permanently wipe test orders and reset ledger metrics to zero"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isResetting ? "Resetting..." : "Reset Ledger (0)"}</span>
            </button>

            <button
              onClick={() => {
                fetchOrders();
                loadProducts();
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Refresh all data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition shadow-sm cursor-pointer"
              title="Lock Admin Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Business KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Gross Sales (Revenue)</span>
              <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">
              KSH {analytics.grossRevenue.toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-medium">
                From {analytics.completedCount} fulfilled orders
              </span>
              {selectedMonth !== "ALL" && (
                <span className="text-slate-500 font-mono">
                  All-time: KSH {analytics.allTimeGross.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Net Profit (Exact Cost)</span>
              <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400">
              KSH {analytics.exactNetProfit.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400 font-medium">
              Based on actual item cost prices
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Units Dispatched</span>
              <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">
              {analytics.totalUnitsSold} <span className="text-xs text-slate-400 font-normal">items</span>
            </p>
            <span className="text-[11px] text-slate-400 font-medium">
              Across footwear, rackets & kits
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Pending Orders</span>
              <div className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/50">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-400">
              {analytics.pendingCount}
            </p>
            <span className="text-[11px] text-amber-300/80 font-medium">
              Awaiting payment or pickup
            </span>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "orders"
                ? "bg-emerald-500 text-black shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Orders & Sales Ledger ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "inventory"
                ? "bg-emerald-500 text-black shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalog & Stock Manager ({products.length})</span>
          </button>
        </div>

        {/* ======================= TAB 1: ORDERS & SALES LEDGER ======================= */}
        {activeTab === "orders" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
            <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-white">Live Customer Orders & Payments</h3>
                <p className="text-xs text-slate-400">
                  Track client names, sizes, delivery notes, generate PDF monthly receipts, and clear the active view.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 3-Way Segmented Board View */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setOrderViewScope("active")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      orderViewScope === "active"
                        ? "bg-emerald-500 text-black shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Active Board ({orders.filter((o) => !o.is_archived && o.status !== "cancelled").length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderViewScope("archived")}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                      orderViewScope === "archived"
                        ? "bg-emerald-500 text-black shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Archive className="w-3 h-3" />
                    <span>Fulfilled Ledger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderViewScope("cancelled")}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                      orderViewScope === "cancelled"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Cancelled ({orders.filter((o) => o.status === "cancelled").length})</span>
                  </button>
                </div>

                {/* Export PDF Button */}
                <button
                  type="button"
                  disabled={isExportingPdf || displayedOrders.length === 0}
                  onClick={generateSalesPdf}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40"
                  title="Export styled PDF report"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isExportingPdf ? "Generating..." : "Export PDF Report"}</span>
                </button>

                {/* Bulk Clear Actions for Active View */}
                {orderViewScope === "active" && (
                  <>
                    <button
                      type="button"
                      onClick={archiveAllCompleted}
                      className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Move all fulfilled orders to archive to clean the view"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Clear Fulfilled</span>
                    </button>

                    {orders.some((o) => o.status === "cancelled" && !o.is_archived) && (
                      <button
                        type="button"
                        onClick={dismissAllCancelled}
                        className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Push cancelled orders to the Cancelled Space"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Clear Cancelled</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {loadingOrders ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Loading sales ledger...
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-sm font-bold text-slate-400">
                  {orderViewScope === "active"
                    ? "Active board is clean and clear."
                    : orderViewScope === "cancelled"
                    ? "No cancelled orders on record for this period."
                    : "No fulfilled orders in the archive for this period."}
                </p>
                <p className="text-xs text-slate-600">
                  {orderViewScope === "active"
                    ? "New orders submitted through WhatsApp checkout will appear here in real-time."
                    : orderViewScope === "cancelled"
                    ? "Orders cancelled by customers or staff will be safely preserved here."
                    : "Fulfilled orders you have cleared from the active board are stored here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Items & Sizes</th>
                      <th className="p-4">Fulfillment</th>
                      <th className="p-4">Order Value</th>
                      <th className="p-4">Status & Action</th>
                      <th className="p-4 text-right">Ledger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedOrders.map((order) => {
                      const isPending = order.status === "pending";
                      const isCompleted = order.status === "completed";
                      const isCancelled = order.status === "cancelled";
                      const formattedDate = new Date(order.created_at).toLocaleString("en-KE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      });

                      return (
                        <tr key={order.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-4 text-slate-400 whitespace-nowrap">
                            {formattedDate}
                          </td>

                          <td className="p-4">
                            <strong className="text-white block font-bold text-xs">
                              {order.customer_name}
                            </strong>
                            {order.customer_phone && (
                              <a
                                href={`tel:${order.customer_phone}`}
                                className="text-[11px] text-emerald-400 flex items-center gap-1 hover:underline mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{order.customer_phone}</span>
                              </a>
                            )}
                          </td>

                          <td className="p-4 max-w-xs">
                            <div className="space-y-1">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-slate-200">
                                  <span className="font-bold text-white">{item.quantity}×</span>
                                  <span className="truncate">{item.name}</span>
                                  {item.size && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800/80 text-emerald-300 font-bold text-[10px]">
                                      Sz: {item.size}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="p-4 max-w-xs">
                            <div className="flex items-start gap-1 text-[11px] text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="block leading-tight font-medium">
                                  {order.fulfillment_method}
                                </span>
                                {order.delivery_notes && (
                                  <span className="text-[10px] text-slate-500 italic block mt-0.5">
                                    &ldquo;{order.delivery_notes}&rdquo;
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            <strong className="text-sm font-black text-emerald-400">
                              KSH {Number(order.total_amount).toLocaleString()}
                            </strong>
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isCompleted
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                    : isCancelled
                                    ? "bg-rose-950 text-rose-400 border border-rose-800"
                                    : "bg-amber-950 text-amber-400 border border-amber-800"
                                }`}
                              >
                                {order.status}
                              </span>

                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() => updateOrderStatus(order.id, "completed")}
                                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] transition cursor-pointer disabled:opacity-40"
                                    title="Mark as Paid / Collected"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() => updateOrderStatus(order.id, "cancelled")}
                                    className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-400 transition cursor-pointer disabled:opacity-40"
                                    title="Cancel & Restock Items"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {(isCompleted || isCancelled) && (
                                <button
                                  type="button"
                                  disabled={updatingOrderId === order.id}
                                  onClick={() => updateOrderStatus(order.id, "pending")}
                                  className="p-1 text-slate-500 hover:text-slate-300 transition text-[10px] underline cursor-pointer"
                                  title="Revert to pending"
                                >
                                  Revert
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Individual Archive / Unarchive Action */}
                          <td className="p-4 text-right whitespace-nowrap">
                            {order.is_archived ? (
                              <button
                                type="button"
                                onClick={() => toggleArchiveOrder(order.id, false)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Restore to active board"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleArchiveOrder(order.id, true)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition cursor-pointer border border-slate-800"
                                title="Move to archive"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: INVENTORY & STOCK MANAGER ======================= */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Live Banner Editor */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-emerald-400" />
                  Live Homepage Moving Ticker Announcement
                </h2>
                {bannerSavedStatus && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
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
                  className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition font-medium"
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Add Equipment & Configure Details
                </h2>

                <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
                  {/* Product Name */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Equipment / Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kawasaki Badminton Shoes or Arsenal Away Kit"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 transition font-medium"
                    />
                  </div>

                  {/* Brand Quick-Select Chips */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Brand / Maker
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {BRANDS.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBrand(b)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            brand === b
                              ? "bg-emerald-500 text-black shadow-xs"
                              : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category & Stock Quantity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setSelectedSizes([]);
                          setSizeStocks({});
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 transition font-medium"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">
                        {selectedSizes.length > 0 ? "Total Stock (Auto-Sum)" : "Stock Quantity"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        disabled={selectedSizes.length > 0}
                        value={
                          selectedSizes.length > 0
                            ? Object.values(sizeStocks).reduce((a, b) => a + b, 0)
                            : stockQuantity
                        }
                        onChange={(e) => setStockQuantity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-emerald-500 transition disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Pricing & Cost Margin Section */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-2xl space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pricing & Profit Margins
                    </span>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                          Buying Cost *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 1000"
                          value={costPrice}
                          onChange={(e) => setCostPrice(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-emerald-400 mb-1 font-semibold text-[11px]">
                          Selling Price *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 1600"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl p-2 text-emerald-400 font-black focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                          Regular Price
                        </label>
                        <input
                          type="number"
                          placeholder="Strikethrough"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Live Profit Margin Pill */}
                    {liveMargin && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-[11px]">
                        <span className="text-emerald-300 font-medium">Profit per Unit:</span>
                        <span className="text-emerald-400 font-bold">
                          +KSH {liveMargin.profit.toLocaleString()} ({liveMargin.percentage}% Margin)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Storefront Highlight Badge */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Storefront Badge
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {BADGES.map((b) => (
                        <button
                          key={b.value}
                          type="button"
                          onClick={() => setBadge(b.value)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                            badge === b.value
                              ? "bg-emerald-500 text-black shadow-xs"
                              : "bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sizes Selector */}
                  {(isFootwear || isApparelOrJersey) && (
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-300 font-bold text-xs">
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
                                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>

                      {selectedSizes.length > 0 && (
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Set stock count for each size:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedSizes.map((sz) => (
                              <div
                                key={sz}
                                className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5"
                              >
                                <span className="text-xs font-bold text-slate-200">Size {sz}:</span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    value={sizeStocks[sz] ?? 1}
                                    onChange={(e) =>
                                      handleSizeStockChange(sz, parseInt(e.target.value, 10) || 0)
                                    }
                                    className="w-12 text-center text-xs font-black bg-slate-800 border border-slate-700 rounded-lg py-1 text-emerald-400 focus:outline-none"
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
                    <label className="block text-slate-400 mb-1.5 font-semibold">
                      Product Photos (Up to 4 angles)
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setImageMode("upload")}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          imageMode === "upload"
                            ? "bg-emerald-950/60 border-emerald-500 text-emerald-400"
                            : "bg-slate-950 border border-slate-800 text-slate-400"
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
                            ? "bg-emerald-950/60 border-emerald-500 text-emerald-400"
                            : "bg-slate-950 border border-slate-800 text-slate-400"
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
                              <div
                                key={idx}
                                className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
                              >
                                <img
                                  src={url}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
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
                              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-950 transition text-center group"
                            >
                              <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition mb-1" />
                              <span className="text-[11px] font-semibold text-slate-200">
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
                              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-950 transition text-center group"
                            >
                              <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition mb-1" />
                              <span className="text-[11px] font-semibold text-slate-200">
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
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 transition text-xs"
                            />
                            {urlInputs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeUrlSlot(idx)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
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
                            className="text-emerald-400 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Another URL
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Roomy Specs & Description Area */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-400 font-semibold">
                        Detailed Specs & Product Description
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {description.length} chars
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      placeholder="Add comprehensive specs:&#10;• Frame material / string tension (e.g. 24-28 lbs)&#10;• Sole grip & cushion type&#10;• Fitting notes (e.g. snug fit, recommend 1 size up)&#10;• Included accessories"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition leading-relaxed resize-y font-normal"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3.5 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-98 text-xs tracking-wide"
                  >
                    {submitting ? "Publishing to Shop..." : "Publish to Shop Catalog"}
                  </button>
                </form>
              </div>

              {/* Active Inventory List */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
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
                      const hasDiscount =
                        p.original_price && Number(p.original_price) > Number(p.price);
                      const photoCount =
                        p.images && p.images.length > 0 ? p.images.length : p.image_url ? 1 : 0;

                      return (
                        <div
                          key={p.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 gap-3 transition"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-white text-xs block truncate">
                                  {p.name}
                                </span>
                                {(p as any).badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-950 border border-emerald-800 text-emerald-400">
                                    {(p as any).badge}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-emerald-400 font-black">
                                  KSH {Number(p.price).toLocaleString()}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    KSH {Number(p.original_price).toLocaleString()}
                                  </span>
                                )}
                                {(p as any).brand && (
                                  <span className="text-[10px] text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 font-semibold">
                                    {(p as any).brand}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-medium">
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
                                              ? "bg-rose-950 text-rose-500 line-through"
                                              : "bg-slate-800 text-slate-300"
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

                          <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-800">
                            {/* Quick Stock Stepper */}
                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleQuickStockClick(p, -1)}
                                disabled={qty === 0}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer transition"
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
                                    : "text-white"
                                }`}
                              >
                                {qty}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleQuickStockClick(p, 1)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition"
                                title="Increase Stock"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-black text-slate-300 transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Edit Details & Photos"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

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
        )}
      </div>

      {/* Quick Size Selection Mini-Modal */}
      {quickStockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-white">
                  {quickStockTarget.delta > 0 ? "Add +1 Pair to Size" : "Remove -1 Pair from Size"}
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
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
              <p className="text-[11px] font-semibold text-slate-400">
                Select which size to {quickStockTarget.delta > 0 ? "increase" : "decrease"}:
              </p>

              <div className="grid grid-cols-3 gap-2">
                {(
                  quickStockTarget.product.available_sizes ||
                  (quickStockTarget.product.size_stocks
                    ? Object.keys(quickStockTarget.product.size_stocks)
                    : [])
                ).map((sz) => {
                  const currentCount = quickStockTarget.product.size_stocks?.[sz] ?? 0;
                  const isButtonDisabled = quickStockTarget.delta < 0 && currentCount <= 0;

                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={isButtonDisabled}
                      onClick={() => applySizeStockChange(sz)}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-emerald-500 hover:text-black transition flex flex-col items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                      <span className="text-xs font-bold text-slate-200 group-hover:text-black">
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
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
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
                <label className="block text-slate-400 mb-1 font-semibold">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Brand
                  </label>
                  <select
                    value={editFormData.brand}
                    onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Category
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, category: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Buying Cost (KSH) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editFormData.cost_price}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, cost_price: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Sale Price (KSH) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Regular Price (KSH)
                  </label>
                  <input
                    type="number"
                    value={editFormData.original_price}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, original_price: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Storefront Badge
                  </label>
                  <select
                    value={editFormData.badge}
                    onChange={(e) => setEditFormData({ ...editFormData, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {BADGES.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    {editFormData.available_sizes.length > 0
                      ? "Total Stock (Auto-Sum)"
                      : "Stock Units"}
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
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, stock_quantity: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold disabled:opacity-60"
                  />
                </div>
              </div>

              {(isEditFootwear || isEditApparelOrJersey) && (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <label className="block text-slate-300 font-bold">
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
                              : "bg-slate-900 border border-slate-800 text-slate-400"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>

                  {editFormData.available_sizes.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Edit Pairs per Size:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {editFormData.available_sizes.map((sz) => (
                          <div
                            key={sz}
                            className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5"
                          >
                            <span className="text-xs font-bold text-slate-200">Size {sz}:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={editFormData.size_stocks[sz] ?? 1}
                                onChange={(e) =>
                                  handleEditSizeStockChange(sz, parseInt(e.target.value, 10) || 0)
                                }
                                className="w-12 text-center text-xs font-black bg-slate-800 border border-slate-700 rounded-lg py-1 text-emerald-400 focus:outline-none"
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

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-400 font-semibold">
                    Photo URLs (Up to 4)
                  </label>
                  {editFormData.images.length < 4 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({ ...editFormData, images: [...editFormData.images, ""] })
                      }
                      className="text-emerald-400 font-bold hover:underline cursor-pointer"
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
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-xs"
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
                <label className="block text-slate-400 mb-1 font-semibold">
                  Specs & Description
                </label>
                <textarea
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
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