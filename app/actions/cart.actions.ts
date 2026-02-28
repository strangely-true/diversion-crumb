"use server";

import { CartService } from "@/server/services/cart.service";
import {
  addCartItemSchema,
  getCartQuerySchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/server/validation/cart.schemas";

export async function getCartAction(userId: string | undefined, input: unknown) {
  const payload = getCartQuerySchema.parse(input);
  return CartService.getCart(userId, payload);
}

export async function addCartItemAction(userId: string | undefined, input: unknown) {
  const payload = addCartItemSchema.parse(input);
  return CartService.addItem(userId, payload);
}

export async function updateCartItemAction(userId: string | undefined, itemId: string, input: unknown) {
  const payload = updateCartItemSchema.parse(input);
  return CartService.updateItemQuantity(userId, itemId, payload);
}

export async function removeCartItemAction(userId: string | undefined, itemId: string, input: unknown) {
  const payload = removeCartItemSchema.parse(input);
  return CartService.removeItem(userId, itemId, payload);
}
