"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/components/ProductCard";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product & { selectedSize?: string }) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to determine exact stock limit for a product/size combination
function getItemStockLimit(product: Product, size?: string): number {
  if (size && product.size_stocks && typeof product.size_stocks[size] === "number") {
    return product.size_stocks[size];
  }
  return product.stock_quantity ?? (product.in_stock ? 10 : 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("elim_cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart storage", e);
      }
    }
  }, []);

  // Save cart changes to localStorage
  useEffect(() => {
    localStorage.setItem("elim_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (itemToAdd: Product & { selectedSize?: string }) => {
    const { selectedSize, ...product } = itemToAdd;
    const availableStock = getItemStockLimit(product, selectedSize);

    if (availableStock <= 0) {
      alert(
        selectedSize
          ? `Size ${selectedSize} is currently sold out!`
          : "This item is currently sold out!"
      );
      return;
    }

    setCart((prevCart) => {
      // Find matching item by ID AND selected size
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          (item.selectedSize || undefined) === (selectedSize || undefined)
      );

      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        if (existing.quantity >= availableStock) {
          const isFootwear = product.category?.toLowerCase().includes("footwear") || product.category?.toLowerCase().includes("boot");
          const unit = isFootwear ? "pairs" : "units";
          alert(
            selectedSize
              ? `Only ${availableStock} ${unit} available in Size ${selectedSize}!`
              : `Only ${availableStock} ${unit} available in stock!`
          );
          return prevCart;
        }

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        return updated;
      }

      return [
        ...prevCart,
        {
          product,
          quantity: 1,
          selectedSize: selectedSize || undefined,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number, selectedSize?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        const isMatch =
          item.product.id === productId &&
          (item.selectedSize || undefined) === (selectedSize || undefined);

        if (isMatch) {
          const maxStock = getItemStockLimit(item.product, item.selectedSize);
          
          if (quantity > maxStock) {
            const isFootwear = item.product.category?.toLowerCase().includes("footwear") || item.product.category?.toLowerCase().includes("boot");
            const unit = isFootwear ? "pairs" : "units";
            alert(
              item.selectedSize
                ? `Only ${maxStock} ${unit} available in Size ${item.selectedSize}!`
                : `Only ${maxStock} ${unit} available!`
            );
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, selectedSize?: string) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(
            item.product.id === productId &&
            (item.selectedSize || undefined) === (selectedSize || undefined)
          )
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}