export interface ProductType {
  id?: string;
  name?: string;
  image_url?: string;
  images?: string[];
  [key: string]: unknown;
}

export function getProductImages(product?: ProductType | null): string[] {
  if (!product) return ["/placeholder.png"];

  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter(
      (img: string) => typeof img === "string" && img.trim() !== ""
    );
    if (validImages.length > 0) return validImages;
  }

  if (product.image_url && typeof product.image_url === "string" && product.image_url.trim() !== "") {
    return [product.image_url];
  }

  return ["/placeholder.png"];
}