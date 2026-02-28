import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession, requireAdmin, requireAuth } from "@/server/auth/auth";
import { withErrorHandling } from "@/server/errors/handle-error";
import { createOrderSchema, updateOrderStatusSchema } from "@/server/validation/order.schemas";
import { OrderService } from "@/server/services/order.service";

export class OrderController {
  static async createFromCart(request: NextRequest) {
    return withErrorHandling(async () => {
      const session = await requireAuth(request);
      const payload = createOrderSchema.parse(await request.json());

      const data = await OrderService.createFromCart(session.userId, session.role, payload);
      return NextResponse.json(data, { status: 201 });
    });
  }

  static async listMine(request: NextRequest) {
    return withErrorHandling(async () => {
      const session = await requireAuth(request);
      const data = await OrderService.getOrdersForUser(session.userId);
      return NextResponse.json(data);
    });
  }

  static async getById(request: NextRequest, orderId: string) {
    return withErrorHandling(async () => {
      const session = await getOptionalSession(request);
      const data = await OrderService.getOrderById(orderId, session?.userId, session?.role);
      return NextResponse.json(data);
    });
  }

  static async updateStatus(request: NextRequest, orderId: string) {
    return withErrorHandling(async () => {
      const session = await requireAdmin(request);
      const payload = updateOrderStatusSchema.parse(await request.json());

      const data = await OrderService.updateOrderStatus(orderId, session.userId, payload);
      return NextResponse.json(data);
    });
  }
}
