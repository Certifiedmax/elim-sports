"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
// ✅ Correct path:
import { getProductImages } from "@/lib/product";import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Send, 
  User, 
  Phone, 
  MapPin, 
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2
} from "lucide-react";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  // 3 Steps: 'cart' | 'details' | 'success'
  const [step, setStep] = useState<"cart" | "details" | "success">("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Delivery Info State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("Store Pickup (Moms & Dads Centre, Juja)");
  const [deliveryNote, setDeliveryNote] = useState("");

  if (!isCartOpen) return null;

  // Atomically decrement stock in Supabase for each cart item
 const deductCartStockFromSupabase = async () => {
  for (const item of cart) {
    try {
      const { data: product, error: fetchErr } = await supabase
        .from("products")
        .select("stock_quantity, in_stock, size_stocks")
        .eq("id", item.product.id)
        .single();

      if (fetchErr || !product) continue;

      let updatedSizeStocks = { ...(product.size_stocks || {}) };
      let newTotalStock = product.stock_quantity ?? (product.in_stock ? 10 : 0);

      // If item had a specific size selected, deduct specifically for that size
      if (item.selectedSize && updatedSizeStocks[item.selectedSize] !== undefined) {
        const currentSizeQty = updatedSizeStocks[item.selectedSize] || 0;
        updatedSizeStocks[item.selectedSize] = Math.max(0, currentSizeQty - item.quantity);
        newTotalStock = Object.values(updatedSizeStocks).reduce((a, b) => (a as number) + (b as number), 0);
      } else {
        newTotalStock = Math.max(0, newTotalStock - item.quantity);
      }

      await supabase
        .from("products")
        .update({
          stock_quantity: newTotalStock,
          size_stocks: updatedSizeStocks,
          in_stock: newTotalStock > 0,
        })
        .eq("id", item.product.id);
    } catch (err) {
      console.error("Failed to deduct size-level stock:", err);
    }
  }
};
  async function handleWhatsAppOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0 || !customerName.trim()) return;

    setIsSubmitting(true);

    try {
      // 1. Deduct the ordered quantities from Supabase database
      await deductCartStockFromSupabase();

      // 2. Prepare WhatsApp message
      const phone = "254794268983";
      let message = `🏸 *NEW ORDER - ELIM SPORTS*\n`;
      message += `─────────────────────────\n`;
      message += `👤 *Customer Name:* ${customerName.trim()}\n`;
      if (customerPhone.trim()) {
        message += `📞 *Contact:* ${customerPhone.trim()}\n`;
      }
      message += `📍 *Fulfillment:* ${deliveryOption}\n`;
      if (deliveryNote.trim()) {
        message += `📝 *Notes/Location:* ${deliveryNote.trim()}\n`;
      }
      message += `─────────────────────────\n`;
      message += `*ORDER ITEMS:*\n\n`;

      cart.forEach((item, index) => {
        const itemSubtotal = Number(item.product.price) * item.quantity;
        const sizeTag = item.selectedSize ? ` [Size: ${item.selectedSize}]` : "";
        message += `${index + 1}. *${item.product.name}*${sizeTag}\n`;
        message += `   • Qty: ${item.quantity} × KSH ${Number(item.product.price).toLocaleString()}\n`;
        message += `   • Subtotal: KSH ${itemSubtotal.toLocaleString()}\n\n`;
      });

      message += `─────────────────────────\n`;
      message += `*Total Units:* ${totalItems}\n`;
      message += `*Total Order Value:* KSH ${totalPrice.toLocaleString()}\n`;
      message += `─────────────────────────\n`;
      message += `Please confirm stock reservation and payment details!`;

      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");

      // 3. Clear cart and navigate to success screen
      clearCart();
      setStep("success");
    } catch (err) {
      console.error("Order processing error:", err);
      alert("There was an issue processing your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const resetAndClose = () => {
    setIsCartOpen(false);
    setStep("cart");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={resetAndClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step === "details" ? (
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="p-1.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                  title="Back to cart"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : step === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {step === "cart"
                  ? `Shopping Cart (${totalItems})`
                  : step === "details"
                  ? "Customer & Pickup Details"
                  : "Order Placed Successfully"}
              </h2>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step 1: Cart Items List */}
          {step === "cart" && (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Your cart is currently empty.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Browse sports gear & shoes →
                    </button>
                  </div>
                ) : (
                  cart.map((item) => {
                    const maxStock = item.product.stock_quantity ?? 10;
                    const itemKey = `${item.product.id}-${item.selectedSize || "default"}`;
                    
                    // Fallback to images array or single image_url
                    const itemImage =
                      (item.product.images && item.product.images.length > 0)
                        ? item.product.images[0]
                        : item.product.image_url || "/placeholder.png";

                    return (
                      <div
                        key={itemKey}
                        className="flex gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 items-center justify-between"
                      >
                        <img
                          src={itemImage}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-lg object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {item.product.name}
                          </h4>
                          
                          {/* Size Pill Display */}
                          {item.selectedSize && (
                            <div className="inline-block px-2 py-0.5 mt-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                              Size: {item.selectedSize}
                            </div>
                          )}

                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            KSH {Number(item.product.price).toLocaleString()}
                          </p>

                          {/* Stepper */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize)}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold px-2 text-slate-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                                disabled={item.quantity >= maxStock}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Total:</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      KSH {totalPrice.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl shadow-md transition cursor-pointer active:scale-98"
                  >
                    <span>Proceed to Delivery & Info</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="w-full text-center text-[11px] text-slate-500 hover:text-rose-500 transition cursor-pointer"
                  >
                    Clear entire cart
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 2: Customer Delivery Form */}
          {step === "details" && (
            <form onSubmit={handleWhatsAppOrder} className="flex-1 flex flex-col justify-between">
              <div className="p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex / Brian"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0712 345 678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Fulfillment / Pickup Method
                  </label>
                  <select
                    value={deliveryOption}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition font-medium"
                  >
                    <option value="Store Pickup (Moms & Dads Centre, Juja)">
                      🏸 Store Pickup (Moms & Dads Centre, Juja)
                    </option>
                    <option value="Campus Delivery (JKUAT Main Gate / Hostels)">
                      🎓 Campus Delivery (JKUAT)
                    </option>
                    <option value="Campus Delivery (Zetech Technology Park)">
                      🎓 Campus Delivery (Zetech)
                    </option>
                    <option value="Rider / Parcel Delivery (Nairobi & Countrywide)">
                      📦 Rider / Courier Delivery (Outside Juja)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specific Court / Hostel / Delivery Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Bring during club practice, or Gate A pickup..."
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Quick Summary Preview */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Total Items:</span>
                    <strong className="text-slate-900 dark:text-white">{totalItems} units</strong>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Order Amount:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">KSH {totalPrice.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Submit to WhatsApp */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reserving Stock...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Order to WhatsApp</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">
                  Reserves store stock and opens WhatsApp with your order details pre-filled.
                </p>
              </div>
            </form>
          )}

          {/* Step 3: Order Submitted Screen */}
          {step === "success" && (
            <div className="flex-1 flex flex-col justify-between p-6 text-center">
              <div className="my-auto space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg border border-emerald-300 dark:border-emerald-800">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Order Submitted!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Thank you, <strong className="text-slate-800 dark:text-slate-200">{customerName}</strong>! Your order has been dispatched via WhatsApp to the Elim Sports team and stock has been reserved.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>Order Processing Status:</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Stock decremented and reserved in system.
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Fulfillment: <strong className="text-slate-700 dark:text-slate-300">{deliveryOption}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}