export interface ProductSize {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  category: "Footwear" | "Rackets & Paddles" | "Jerseys & Kits" | "Apparel & Gym" | "Accessories & Gear";
  price: number;
  originalPrice?: number;
  images: string[];
  image?: string; // Fallback for single image legacy products
  sizes: ProductSize[];
  description?: string;
  featured?: boolean;
}