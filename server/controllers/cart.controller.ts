import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/server/auth/auth";
import { withErrorHandling } from "@/server/errors/handle-error";
import {
  addCartItemSchema,
  getCartQuerySchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/server/validation/cart.schemas";
import { CartService } from "@/server/services/cart.service";

export class CartController {
  static async getCart(request: NextRequest) {
    return withErrorHandling(async () => {
      const session = await getOptionalSession(request);
      const payload = getCartQuerySchema.parse({
        sessionId: request.nextUrl.searchParams.get("sessionId") ?? undefined,
        currency: request.nextUrl.searchParams.get("currency") ?? "USD",
      });

      const data = await CartService.getCart(session?.userId, payload);
      return NextResponse.json(data);
    });
  }

  static async addItem(request: NextRequest) {
    return withErrorHandling(async () => {
      const session = await getOptionalSession(request);
      const payload = addCartItemSchema.parse(await request.json());

      const data = await CartService.addItem(session?.userId, payload);
      return NextResponse.json(data);
    });
  }

  static async updateItem(request: NextRequest, itemId: string) {
    return withErrorHandling(async () => {
      const session = await getOptionalSession(request);
      const payload = updateCartItemSchema.parse(await request.json());

      const data = await CartService.updateItemQuantity(session?.userId, itemId, payload);
      return NextResponse.json(data);
    });
  }

  static async removeItem(request: NextRequest, itemId: string) {
    return withErrorHandling(async () => {
      const session = await getOptionalSession(request);
      const payload = removeCartItemSchema.parse(await request.json().catch(() => ({})));

      const data = await CartService.removeItem(session?.userId, itemId, payload);
      return NextResponse.json(data);
    });
  }
}
