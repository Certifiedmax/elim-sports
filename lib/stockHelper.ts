import { supabase } from "@/lib/supabase";

export interface OrderItemPayload {
  product_id: string;
  name: string;
  category?: string;
  size?: string;
  quantity: number;
  price: number;
}

// Restores stock back to products table (e.g. when an order is modified or cancelled)
export async function restoreOrderStock(items: OrderItemPayload[]) {
  for (const item of items) {
    try {
      const { data: product, error: fetchErr } = await supabase
        .from("products")
        .select("stock_quantity, in_stock, size_stocks")
        .eq("id", item.product_id)
        .single();

      if (fetchErr || !product) continue;

      let updatedSizeStocks = { ...(product.size_stocks || {}) };
      let newTotalStock = product.stock_quantity ?? (product.in_stock ? 10 : 0);

      if (item.size && updatedSizeStocks[item.size] !== undefined) {
        updatedSizeStocks[item.size] = (updatedSizeStocks[item.size] || 0) + item.quantity;
        newTotalStock = Object.values(updatedSizeStocks).reduce(
          (a, b) => (a as number) + (b as number),
          0
        );
      } else {
        newTotalStock = newTotalStock + item.quantity;
      }

      await supabase
        .from("products")
        .update({
          stock_quantity: newTotalStock,
          size_stocks: updatedSizeStocks,
          in_stock: newTotalStock > 0,
        })
        .eq("id", item.product_id);
    } catch (err) {
      console.error("Failed to restore stock for product:", item.product_id, err);
    }
  }
}

// Deducts stock from products table (e.g. when order is confirmed or reinstated)
export async function deductOrderStock(items: OrderItemPayload[]) {
  for (const item of items) {
    try {
      const { data: product, error: fetchErr } = await supabase
        .from("products")
        .select("stock_quantity, in_stock, size_stocks")
        .eq("id", item.product_id)
        .single();

      if (fetchErr || !product) continue;

      let updatedSizeStocks = { ...(product.size_stocks || {}) };
      let newTotalStock = product.stock_quantity ?? (product.in_stock ? 10 : 0);

      if (item.size && updatedSizeStocks[item.size] !== undefined) {
        updatedSizeStocks[item.size] = Math.max(0, (updatedSizeStocks[item.size] || 0) - item.quantity);
        newTotalStock = Object.values(updatedSizeStocks).reduce(
          (a, b) => (a as number) + (b as number),
          0
        );
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
        .eq("id", item.product_id);
    } catch (err) {
      console.error("Failed to deduct stock for product:", item.product_id, err);
    }
  }
}