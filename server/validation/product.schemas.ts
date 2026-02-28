import { ProductStatus } from "@/generated/prisma/enums";
import { z } from "zod";
import { parseNumber } from "@/server/validation/common";

export const listProductsQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(50).default(12),
  search: z.string().trim().optional(),
  categorySlug: z.string().trim().optional(),
  status: z.enum(ProductStatus).optional(),
  includeDrafts: z.boolean().default(false),
});

const variantInputSchema = z.object({
  sku: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().optional(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  currency: z.string().length(3).toUpperCase().default("USD"),
  isActive: z.boolean().default(true),
  weight: z.number().nonnegative().optional(),
  initialStock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(0),
});

const productImageInputSchema = z.object({
  url: z.string().url(),
  altText: z.string().trim().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});

const nutritionPerServingSchema = z.object({
  calories: z.number().nonnegative().optional(),
  fatG: z.number().nonnegative().optional(),
  saturatedFatG: z.number().nonnegative().optional(),
  carbsG: z.number().nonnegative().optional(),
  sugarG: z.number().nonnegative().optional(),
  proteinG: z.number().nonnegative().optional(),
  fiberG: z.number().nonnegative().optional(),
  sodiumMg: z.number().nonnegative().optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().optional(),
  status: z.enum(ProductStatus).default(ProductStatus.DRAFT),
  tags: z.array(z.string().trim().min(1)).default([]),
  heroImage: z.string().url().optional(),
  servingSize: z.string().trim().optional(),
  ingredients: z.string().trim().optional(),
  allergens: z.array(z.string().trim().min(1)).default([]),
  nutritionPerServing: nutritionPerServingSchema.optional(),
  categoryId: z.uuid().optional(),
  images: z.array(productImageInputSchema).default([]),
  variants: z.array(variantInputSchema).min(1),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).optional(),
  slug: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  status: z.enum(ProductStatus).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  heroImage: z.string().url().optional().nullable(),
  servingSize: z.string().trim().optional().nullable(),
  ingredients: z.string().trim().optional().nullable(),
  allergens: z.array(z.string().trim().min(1)).optional(),
  nutritionPerServing: nutritionPerServingSchema.optional().nullable(),
  categoryId: z.uuid().optional().nullable(),
  images: z.array(productImageInputSchema).optional(),
});

export const adjustInventorySchema = z.object({
  quantityDelta: z.number().int(),
  reason: z.enum(["INITIAL", "PURCHASE", "ADJUSTMENT", "ORDER_FULFILLED", "ORDER_CANCELLED", "MANUAL"]),
  reference: z.string().trim().optional(),
});

export function parseListProductsQuery(searchParams: URLSearchParams) {
  return listProductsQuerySchema.parse({
    page: parseNumber(searchParams.get("page"), 1),
    pageSize: parseNumber(searchParams.get("pageSize"), 12),
    search: searchParams.get("search") ?? undefined,
    categorySlug: searchParams.get("categorySlug") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    includeDrafts: searchParams.get("includeDrafts") === "true",
  });
}
