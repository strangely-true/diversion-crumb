import { CartStatus, ProductStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/prisma/client";
import { AppError } from "@/server/errors/app-error";
import {
  addCartItemSchema,
  getCartQuerySchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/server/validation/cart.schemas";

type GetCartInput = ReturnType<typeof getCartQuerySchema.parse>;
type AddCartItemInput = ReturnType<typeof addCartItemSchema.parse>;
type UpdateCartItemInput = ReturnType<typeof updateCartItemSchema.parse>;
type RemoveCartItemInput = ReturnType<typeof removeCartItemSchema.parse>;

function summarizeCart(cart: {
  items: Array<{ quantity: number; unitPrice: number | string | bigint | { toString(): string } }>;
}) {
  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  return {
    subtotal,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export class CartService {
  static async getOrCreateActiveCart(
    userId: string | undefined,
    sessionId: string | undefined,
    currency: string,
  ) {
    const where = userId
      ? { userId, status: CartStatus.ACTIVE }
      : { sessionId, status: CartStatus.ACTIVE };

    let cart = await prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                inventory: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      if (!userId && !sessionId) {
        throw new AppError("sessionId is required for guest carts.", 400, "SESSION_REQUIRED");
      }

      cart = await prisma.cart.create({
        data: {
          userId,
          sessionId: userId ? undefined : sessionId,
          currency,
          status: CartStatus.ACTIVE,
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                  inventory: true,
                },
              },
            },
          },
        },
      });
    }

    return {
      ...cart,
      summary: summarizeCart(cart),
    };
  }

  static async getCart(userId: string | undefined, input: GetCartInput) {
    return this.getOrCreateActiveCart(userId, input.sessionId, input.currency);
  }

  static async addItem(userId: string | undefined, input: AddCartItemInput) {
    const cart = await this.getOrCreateActiveCart(userId, input.sessionId, input.currency);

    const variant = await prisma.productVariant.findUnique({
      where: { id: input.variantId },
      include: {
        product: true,
        inventory: true,
      },
    });

    if (!variant || !variant.isActive || variant.product.status !== ProductStatus.ACTIVE) {
      throw new AppError("Variant is not available for purchase.", 404, "VARIANT_NOT_AVAILABLE");
    }

    const availableQuantity = variant.inventory?.quantity ?? 0;

    if (availableQuantity < input.quantity) {
      throw new AppError("Insufficient inventory.", 400, "INSUFFICIENT_INVENTORY");
    }

    await prisma.$transaction(async (tx) => {
      const db = tx as typeof prisma;

      const existing = await db.cartItem.findFirst({
        where: {
          cartId: cart.id,
          variantId: input.variantId,
        },
      });

      if (existing) {
        const nextQuantity = existing.quantity + input.quantity;
        if (nextQuantity > availableQuantity) {
          throw new AppError("Insufficient inventory.", 400, "INSUFFICIENT_INVENTORY");
        }

        await db.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: nextQuantity,
          },
        });
      } else {
        await db.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: input.variantId,
            quantity: input.quantity,
            unitPrice: variant.price,
          },
        });
      }
    });

    return this.getOrCreateActiveCart(userId, input.sessionId, cart.currency);
  }

  static async updateItemQuantity(userId: string | undefined, itemId: string, input: UpdateCartItemInput) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        variant: {
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!item) {
      throw new AppError("Cart item not found.", 404, "CART_ITEM_NOT_FOUND");
    }

    if (userId && item.cart.userId && item.cart.userId !== userId) {
      throw new AppError("Cannot modify another user's cart.", 403, "FORBIDDEN");
    }

    if (!userId) {
      if (!input.sessionId || item.cart.sessionId !== input.sessionId) {
        throw new AppError("Cannot modify another session cart.", 403, "FORBIDDEN");
      }
    }

    const availableQuantity = item.variant.inventory?.quantity ?? 0;
    if (input.quantity > availableQuantity) {
      throw new AppError("Insufficient inventory.", 400, "INSUFFICIENT_INVENTORY");
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: input.quantity,
      },
    });

    return this.getOrCreateActiveCart(item.cart.userId ?? undefined, item.cart.sessionId ?? undefined, item.cart.currency);
  }

  static async removeItem(userId: string | undefined, itemId: string, input: RemoveCartItemInput) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item) {
      throw new AppError("Cart item not found.", 404, "CART_ITEM_NOT_FOUND");
    }

    if (userId && item.cart.userId && item.cart.userId !== userId) {
      throw new AppError("Cannot modify another user's cart.", 403, "FORBIDDEN");
    }

    if (!userId && input.sessionId && item.cart.sessionId !== input.sessionId) {
      throw new AppError("Cannot modify another session cart.", 403, "FORBIDDEN");
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return this.getOrCreateActiveCart(item.cart.userId ?? undefined, item.cart.sessionId ?? undefined, item.cart.currency);
  }
}
