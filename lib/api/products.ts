import type { Product } from "@/lib/products";
import { apiRequest } from "@/lib/api/client";

type ProductVariantDTO = {
  id: string;
  price: number | string;
};

type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  category: { name: string } | null;
  variants: ProductVariantDTO[];
};

type ListProductsResponse = {
  items: ProductDTO[];
};

const CATEGORY_MAP = {
  cakes: "Cakes",
  bread: "Bread",
  pastries: "Pastries",
} as const;

function toProductCategory(name?: string | null): Product["category"] {
  const normalized = (name ?? "").trim().toLowerCase();
  return CATEGORY_MAP[normalized as keyof typeof CATEGORY_MAP] ?? "Cakes";
}

function mapProduct(dto: ProductDTO): Product | null {
  const primaryVariant = dto.variants[0];
  if (!primaryVariant) {
    return null;
  }

  return {
    id: primaryVariant.id,
    slug: dto.slug,
    name: dto.name,
    description: dto.description ?? "Freshly baked delight.",
    price: Number(primaryVariant.price),
    category: toProductCategory(dto.category?.name),
    image:
      dto.heroImage ??
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
  };
}

export async function fetchProducts() {
  const data = await apiRequest<ListProductsResponse>("/api/products");
  return data.items
    .map(mapProduct)
    .filter((product): product is Product => product !== null);
}
