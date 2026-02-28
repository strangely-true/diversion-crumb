import { OrderStatus } from "@/generated/prisma/enums";
import { z } from "zod";

const orderAddressSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  line1: z.string().trim().min(2),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().min(2),
});

export const createOrderSchema = z.object({
  cartId: z.uuid(),
  agentSessionId: z.string().trim().optional(),
  shippingAddress: orderAddressSchema,
  billingAddress: orderAddressSchema.optional(),
  notes: z.string().trim().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(OrderStatus),
  note: z.string().trim().optional(),
});
