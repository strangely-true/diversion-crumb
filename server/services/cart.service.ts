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

type CartSummaryItem = {
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type CartSummary = {
  totalItems: number;
  subtotal: number;
  items: CartSummaryItem[];
};

function summarizeCart(cart: {
  items: Array<{
    quantity: number;
    unitPrice: number | string | bigint | { toString(): string };
  }>;
}) {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0,
  );
  return {
    subtotal,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export class CartService {
  private static roundMoney(value: number) {
    return Number(value.toFixed(2));
  }

  private static async getCartSummaryByCartId(
    cartId: string,
  ): Promise<CartSummary> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        totalItems: 0,
        subtotal: 0,
        items: [],
      };
    }

    const items = cart.items.map((item) => {
      const unitPrice = Number(item.variant.price);
      const lineTotal = this.roundMoney(unitPrice * item.quantity);
      return {
        productName: item.variant.product.name,
        variantLabel: item.variant.label,
        quantity: item.quantity,
        unitPrice: this.roundMoney(unitPrice),
        lineTotal,
      };
    });

    const subtotal = this.roundMoney(
      items.reduce((sum, item) => sum + item.lineTotal, 0),
    );
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalItems,
      subtotal,
      items,
    };
  }

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
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      if (!userId && !sessionId) {
        throw new AppError(
          "sessionId is required for guest carts.",
          400,
          "SESSION_REQUIRED",
        );
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

  private static async findOrCreateCartId(
    userId: string | undefined,
    sessionId: string | undefined,
    currency: string,
  ): Promise<{ id: string; currency: string }> {
    const where = userId
      ? { userId, status: CartStatus.ACTIVE }
      : { sessionId, status: CartStatus.ACTIVE };

    const existing = await prisma.cart.findFirst({
      where,
      select: { id: true, currency: true },
    });

    if (existing) return existing;

    if (!userId && !sessionId) {
      throw new AppError(
        "sessionId is required for guest carts.",
        400,
        "SESSION_REQUIRED",
      );
    }

    return prisma.cart.create({
      data: {
        userId,
        sessionId: userId ? undefined : sessionId,
        currency,
        status: CartStatus.ACTIVE,
      },
      select: { id: true, currency: true },
    });
  }

  private static async fetchCartForResponse(cartId: string) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: "asc" as const },
        },
      },
    });

    if (!cart) {
      throw new AppError("Cart not found.", 404, "CART_NOT_FOUND");
    }

    return {
      ...cart,
      summary: summarizeCart(cart),
    };
  }

  static async getOrCreateCart(userId: string) {
    if (!userId) {
      throw new AppError("userId is required.", 400, "USER_ID_REQUIRED");
    }

    return this.getOrCreateActiveCart(userId, undefined, "USD");
  }

  static async getCart(userId: string): Promise<CartSummary>;
  static async getCart(
    userId: string | undefined,
    input: GetCartInput,
  ): Promise<Awaited<ReturnType<typeof CartService.getOrCreateActiveCart>>>;
  static async getCart(userId: string | undefined, input?: GetCartInput) {
    if (!input) {
      if (!userId) {
        throw new AppError("userId is required.", 400, "USER_ID_REQUIRED");
      }

      const cart = await this.getOrCreateCart(userId);
      return this.getCartSummaryByCartId(cart.id);
    }

    return this.getOrCreateActiveCart(userId, input.sessionId, input.currency);
  }

  static async addItem(
    userId: string,
    variantId: string,
    quantity: number,
  ): Promise<CartSummary>;
  static async addItem(
    userId: string | undefined,
    input: AddCartItemInput,
  ): Promise<Awaited<ReturnType<typeof CartService.getOrCreateActiveCart>>>;
  static async addItem(
    userId: string | undefined,
    inputOrVariantId: AddCartItemInput | string,
    quantity?: number,
  ) {
    if (typeof inputOrVariantId === "string") {
      if (!userId) {
        throw new AppError("userId is required.", 400, "USER_ID_REQUIRED");
      }

      if (!Number.isInteger(quantity) || (quantity ?? 0) <= 0) {
        throw new AppError("Invalid quantity", 400, "INVALID_QUANTITY");
      }

      const addQuantity = Number(quantity);

      const variant = await prisma.productVariant.findUnique({
        where: { id: inputOrVariantId },
        include: {
          product: true,
        },
      });

      if (!variant) {
        throw new AppError("Variant not found", 404, "VARIANT_NOT_FOUND");
      }

      const cart = await this.getOrCreateCart(userId);
      const existing = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          variantId: inputOrVariantId,
        },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + addQuantity,
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: inputOrVariantId,
            quantity: addQuantity,
            unitPrice: variant.price,
          },
        });
      }

      return this.getCartSummaryByCartId(cart.id);
    }

    const input = inputOrVariantId;

    // Parallel: get cart ID + validate variant (saves a round trip to Neon)
    const [cartInfo, variant] = await Promise.all([
      this.findOrCreateCartId(userId, input.sessionId, input.currency),
      prisma.productVariant.findUnique({
        where: { id: input.variantId },
        include: {
          product: true,
          inventory: true,
        },
      }),
    ]);

    if (
      !variant ||
      !variant.isActive ||
      variant.product.status !== ProductStatus.ACTIVE
    ) {
      throw new AppError(
        "Variant is not available for purchase.",
        404,
        "VARIANT_NOT_AVAILABLE",
      );
    }

    const availableQuantity = variant.inventory?.quantity ?? 0;
    if (availableQuantity < input.quantity) {
      throw new AppError(
        "Insufficient inventory.",
        400,
        "INSUFFICIENT_INVENTORY",
      );
    }

    const cartId = cartInfo.id;

    // Use compound unique key instead of findFirst (faster index lookup, no transaction overhead)
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId: input.variantId } },
      select: { id: true, quantity: true },
    });

    if (existing) {
      const nextQuantity = existing.quantity + input.quantity;
      if (nextQuantity > availableQuantity) {
        throw new AppError(
          "Insufficient inventory.",
          400,
          "INSUFFICIENT_INVENTORY",
        );
      }
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId,
          variantId: input.variantId,
          quantity: input.quantity,
          unitPrice: variant.price,
        },
      });
    }

    // Lean response query using findUnique by PK (faster than findFirst)
    return this.fetchCartForResponse(cartId);
  }

  static async updateQuantity(
    userId: string,
    variantId: string,
    quantity: number,
  ): Promise<CartSummary> {
    if (!userId) {
      throw new AppError("userId is required.", 400, "USER_ID_REQUIRED");
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new AppError("Invalid quantity", 400, "INVALID_QUANTITY");
    }

    const cart = await this.getOrCreateCart(userId);
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId,
      },
    });

    if (quantity === 0) {
      if (existing) {
        await prisma.cartItem.delete({ where: { id: existing.id } });
      }
      return this.getCartSummaryByCartId(cart.id);
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new AppError("Variant not found", 404, "VARIANT_NOT_FOUND");
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
          unitPrice: variant.price,
        },
      });
    }

    return this.getCartSummaryByCartId(cart.id);
  }

  static async updateItemQuantity(
    userId: string | undefined,
    itemId: string,
    input: UpdateCartItemInput,
  ) {
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
      throw new AppError(
        "Cannot modify another user's cart.",
        403,
        "FORBIDDEN",
      );
    }

    if (!userId) {
      if (!input.sessionId || item.cart.sessionId !== input.sessionId) {
        throw new AppError(
          "Cannot modify another session cart.",
          403,
          "FORBIDDEN",
        );
      }
    }

    const availableQuantity = item.variant.inventory?.quantity ?? 0;
    if (input.quantity > availableQuantity) {
      throw new AppError(
        "Insufficient inventory.",
        400,
        "INSUFFICIENT_INVENTORY",
      );
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: input.quantity,
      },
    });

    return this.fetchCartForResponse(item.cart.id);
  }

  static async removeItem(
    userId: string | undefined,
    itemId: string,
    input: RemoveCartItemInput,
  ) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item) {
      throw new AppError("Cart item not found.", 404, "CART_ITEM_NOT_FOUND");
    }

    if (userId && item.cart.userId && item.cart.userId !== userId) {
      throw new AppError(
        "Cannot modify another user's cart.",
        403,
        "FORBIDDEN",
      );
    }

    if (!userId && input.sessionId && item.cart.sessionId !== input.sessionId) {
      throw new AppError(
        "Cannot modify another session cart.",
        403,
        "FORBIDDEN",
      );
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return this.fetchCartForResponse(item.cart.id);
  }
}
