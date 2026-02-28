"use server";

import { UserRole } from "@/generated/prisma/enums";
import { OrderService } from "@/server/services/order.service";
import { createOrderSchema, updateOrderStatusSchema } from "@/server/validation/order.schemas";

export async function createOrderFromCartAction(userId: string | undefined, role: UserRole | undefined, input: unknown) {
  const payload = createOrderSchema.parse(input);
  return OrderService.createFromCart(userId, role, payload);
}

export async function getMyOrdersAction(userId: string) {
  return OrderService.getOrdersForUser(userId);
}

export async function getOrderAction(orderId: string, userId: string | undefined, role: UserRole | undefined) {
  return OrderService.getOrderById(orderId, userId, role);
}

export async function adminUpdateOrderStatusAction(orderId: string, adminUserId: string, input: unknown) {
  const payload = updateOrderStatusSchema.parse(input);
  return OrderService.updateOrderStatus(orderId, adminUserId, payload);
}
