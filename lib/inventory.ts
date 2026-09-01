import { supabase } from "@/lib/supabase";

export interface CartItemOrder {
  id: string;
  name: string;
  quantity: number;
}

export async function deductInventoryStock(items: CartItemOrder[]): Promise<{ success: boolean; error?: string }> {
  try {
    for (const item of items) {
      // 1. Fetch current live stock from Supabase
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock_quantity, in_stock")
        .eq("id", item.id)
        .single();

      if (fetchError || !product) {
        console.error(`Failed to fetch product ${item.id}:`, fetchError);
        continue;
      }

      // 2. Calculate remaining stock
      const currentStock = product.stock_quantity ?? (product.in_stock ? 10 : 0);
      const newStock = Math.max(0, currentStock - item.quantity);
      const isNowInStock = newStock > 0;

      // 3. Atomically update database
      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock_quantity: newStock,
          in_stock: isNowInStock,
        })
        .eq("id", item.id);

      if (updateError) {
        console.error(`Failed to deduct stock for ${item.name}:`, updateError);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sync inventory." };
  }
}