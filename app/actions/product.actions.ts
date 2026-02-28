"use server";

import { ProductService } from "@/server/services/product.service";
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from "@/server/validation/product.schemas";

export async function listProductsAction(input: unknown) {
  const payload = listProductsQuerySchema.parse(input);
  return ProductService.listProducts(payload, false);
}

export async function adminCreateProductAction(input: unknown, adminUserId: string) {
  const payload = createProductSchema.parse(input);
  return ProductService.createProduct(payload, adminUserId);
}

export async function adminUpdateProductAction(productId: string, input: unknown) {
  const payload = updateProductSchema.parse(input);
  return ProductService.updateProduct(productId, payload);
}

export async function adminDeleteProductAction(productId: string) {
  return ProductService.deleteProduct(productId);
}
