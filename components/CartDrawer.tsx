"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { deductOrderStock } from "@/lib/stockHelper";
import { 
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
  Loader2,
  ShieldCheck
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

  // 4 Steps: 'cart' | 'details' | 'review' | 'success'
  const [step, setStep] = useState<"cart" | "details" | "review" | "success">("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Delivery Info State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("Store Pickup (Moms & Dads Centre, Juja)");
  const [deliveryNote, setDeliveryNote] = useState("");

  if (!isCartOpen) return null;

  // Step transition to Review screen
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || cart.length === 0) return;
    setStep("review");
  };

  // Final confirmation: Deducts stock, records order in Supabase & dispatches to WhatsApp
  const handleFinalConfirmAndLaunchWhatsApp = async () => {
    if (cart.length === 0 || !customerName.trim()) return;
    setIsSubmitting(true);

    try {
      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        category: item.product.category,
        size: item.selectedSize || undefined,
        quantity: item.quantity,
        price: Number(item.product.price),
      }));

      // 1. Deduct exact stock per size from Supabase
      await deductOrderStock(orderItems);

      // 2. Insert into orders table
      const { data: insertedOrder, error: orderInsertErr } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim() || null,
            fulfillment_method: deliveryOption,
            delivery_notes: deliveryNote.trim() || null,
            items: orderItems,
            total_amount: totalPrice,
            status: "pending",
            payment_method: "M-Pesa / Cash",
          },
        ])
        .select("id, created_at")
        .single();

      if (orderInsertErr) {
        console.error("Order logging error:", orderInsertErr);
      }

      // 3. Save Active Order in LocalStorage for 10-minute edit/cancel grace window
      if (insertedOrder) {
        const orderSession = {
          orderId: insertedOrder.id,
          createdAt: insertedOrder.created_at,
          items: orderItems,
          customerName: customerName.trim(),
          totalAmount: totalPrice,
          fulfillmentMethod: deliveryOption
        };
        localStorage.setItem("elim_active_order", JSON.stringify(orderSession));
        window.dispatchEvent(new Event("elim_order_placed"));
      }

      // 4. Construct Pre-filled WhatsApp message
      const phone = "254794268983";
      let message = `🏸 *CONFIRMED ORDER - ELIM SPORTS*\n`;
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
      message += `Stock reserved via system. Please confirm order processing & payment details!`;

      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");

      clearCart();
      setStep("success");
    } catch (err) {
      console.error("Order processing error:", err);
      alert("There was an issue processing your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              ) : step === "review" ? (
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="p-1.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                  title="Back to details"
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
                  : step === "review"
                  ? "Review & Confirm Order"
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
                    const maxStock =
                      item.selectedSize && item.product.size_stocks?.[item.selectedSize] !== undefined
                        ? item.product.size_stocks[item.selectedSize]
                        : item.product.stock_quantity ?? 10;

                    const itemKey = `${item.product.id}-${item.selectedSize || "default"}`;
                    const itemImage =
                      item.product.images && item.product.images.length > 0
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
                          className="w-16 h-16 rounded-lg object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {item.product.name}
                          </h4>
                          
                          {/* Size Pill */}
                          {item.selectedSize && (
                            <div className="inline-block px-2 py-0.5 mt-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                              Size: {item.selectedSize}
                            </div>
                          )}

                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            KSH {Number(item.product.price).toLocaleString()}
                          </p>

                          {/* Stepper with explicit handlers */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity === 1) {
                                    removeFromCart(item.product.id, item.selectedSize);
                                  } else {
                                    updateQuantity(item.product.id, item.quantity - 1, item.selectedSize);
                                  }
                                }}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer"
                                title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
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
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                title={item.quantity >= maxStock ? `Max ${maxStock} in Size ${item.selectedSize || ""}` : "Add quantity"}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                              title={`Remove Size ${item.selectedSize || ""} from cart`}
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
            <form onSubmit={handleProceedToReview} className="flex-1 flex flex-col justify-between">
              <div className="p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
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

              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98"
                >
                  <span>Review Order Summary</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Review & Confirmation Screen */}
          {step === "review" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Please review your reservation before dispatching to WhatsApp.</span>
                </div>

                {/* Items Summary */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Reserved Items ({totalItems}):
                  </span>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="truncate pr-2">
                          <strong className="text-slate-900 dark:text-white font-semibold">
                            {item.quantity}× {item.product.name}
                          </strong>
                          {item.selectedSize && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                              Size {item.selectedSize}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          KSH {(Number(item.product.price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Information Breakdown */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer & Fulfillment:
                  </span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 text-xs">
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Name:</strong> {customerName}
                    </p>
                    {customerPhone && (
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Phone:</strong> {customerPhone}
                      </p>
                    )}
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Fulfillment:</strong> {deliveryOption}
                    </p>
                    {deliveryNote && (
                      <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                        &ldquo;{deliveryNote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Total Payable:</span>
                  <strong className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    KSH {totalPrice.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalConfirmAndLaunchWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reserving Stock & Launching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirm & Launch WhatsApp Order</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep("cart")}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition py-1"
                >
                  ← Modify items in cart
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Order Submitted Screen */}
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
                    Thank you, <strong className="text-slate-800 dark:text-slate-200">{customerName}</strong>! Your order has been logged in the system and dispatched via WhatsApp to the Elim Sports team.
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
                      Order recorded in Elim Sports admin ledger.
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Stock decremented and reserved in database.
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