export type ProductCategory = "Cakes" | "Bread" | "Pastries";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image: string;
  featured?: boolean;
};

const CATEGORY_MAP: Record<string, ProductCategory> = {
  cakes: "Cakes",
  bread: "Bread",
  pastries: "Pastries",
};

type DbVariant = {
  id: string;
  price: { toNumber(): number } | number | string;
};

export type DbProductInput = {
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  category: { name: string; slug: string } | null;
  variants: DbVariant[];
};

export function mapDbProductToProduct(db: DbProductInput): Product | null {
  const variant = db.variants[0];
  if (!variant) return null;
  const cat = (db.category?.name ?? "").trim().toLowerCase();
  return {
    id: variant.id,
    slug: db.slug,
    name: db.name,
    description: db.description ?? "Freshly baked delight.",
    price:
      typeof variant.price === "number" ? variant.price : Number(variant.price),
    category: CATEGORY_MAP[cat] ?? "Cakes",
    image:
      db.heroImage ??
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
  };
}
