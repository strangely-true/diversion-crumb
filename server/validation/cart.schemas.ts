import { z } from "zod";

export const getCartQuerySchema = z.object({
  sessionId: z.string().trim().optional(),
  currency: z.string().length(3).toUpperCase().default("USD"),
});

export const addCartItemSchema = z.object({
  sessionId: z.string().trim().optional(),
  currency: z.string().length(3).toUpperCase().default("USD"),
  variantId: z.uuid(),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
  sessionId: z.string().trim().optional(),
});

export const removeCartItemSchema = z.object({
  sessionId: z.string().trim().optional(),
});
