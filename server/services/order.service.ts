import {
  CartStatus,
  InventoryReason,
  MessageRole,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { prisma } from "@/server/prisma/client";
import { AppError } from "@/server/errors/app-error";
import { createOrderSchema, updateOrderStatusSchema } from "@/server/validation/order.schemas";

type CreateOrderInput = ReturnType<typeof createOrderSchema.parse>;
type UpdateOrderStatusInput = ReturnType<typeof updateOrderStatusSchema.parse>;

function createOrderNumber() {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BKY-${stamp}-${random}`;
}

function asMoney(value: number) {
  return Number(value.toFixed(2));
}

function clampDiscountPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Number(value)));
}

function parseDiscountPercentFromText(content: string) {
  if (!/(approve|approved|approval|discount)/i.test(content)) return null;
  const match = content.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) return null;
  return clampDiscountPercent(parsed);
}

export class OrderService {
  static async createFromCart(userId: string | undefined, role: UserRole | undefined, input: CreateOrderInput) {
    const cart = await prisma.cart.findUnique({
      where: { id: input.cartId },
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

    if (!cart || cart.status !== CartStatus.ACTIVE) {
      throw new AppError("Cart is not available for checkout.", 400, "CART_NOT_CHECKOUT_READY");
    }

    if (role !== UserRole.ADMIN) {
      if (!userId || !cart.userId || cart.userId !== userId) {
        throw new AppError("Cannot checkout another user's cart.", 403, "FORBIDDEN");
      }
    }

    if (cart.items.length === 0) {
      throw new AppError("Cart is empty.", 400, "EMPTY_CART");
    }

    const cartItems = cart.items;

    for (const item of cartItems) {
      const available = item.variant.inventory?.quantity ?? 0;
      if (available < item.quantity) {
        throw new AppError(
          `Insufficient inventory for variant ${item.variant.sku}.`,
          400,
          "INSUFFICIENT_INVENTORY",
        );
      }
    }

    const subtotal = asMoney(
      cartItems.reduce((sum: number, item) => sum + Number(item.unitPrice) * item.quantity, 0),
    );
    const tax = asMoney(subtotal * 0.08);
    const shippingFee = subtotal >= 50 ? 0 : 5;
    let appliedDiscountPercent = 0;

    if (input.agentSessionId) {
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId: input.agentSessionId },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 40,
          },
        },
      });

      if (conversation) {
        const metadata =
          conversation.metadata && typeof conversation.metadata === "object"
            ? (conversation.metadata as Record<string, unknown>)
            : {};

        const metadataPercent =
          typeof metadata.approvedDiscountPercent === "number"
            ? clampDiscountPercent(metadata.approvedDiscountPercent)
            : null;

        const latestAdminApprovalPercent = conversation.messages.find((message) => {
          if (message.role !== MessageRole.ASSISTANT) return false;

          const meta =
            message.metadata && typeof message.metadata === "object"
              ? (message.metadata as Record<string, unknown>)
              : {};

          if (meta.approvalType === "discount" && typeof meta.approvedPercent === "number") {
            return true;
          }

          return parseDiscountPercentFromText(message.content) !== null;
        });

        let resolvedFromMessage: number | null = null;
        if (latestAdminApprovalPercent) {
          const msgMeta =
            latestAdminApprovalPercent.metadata && typeof latestAdminApprovalPercent.metadata === "object"
              ? (latestAdminApprovalPercent.metadata as Record<string, unknown>)
              : {};

          if (msgMeta.approvalType === "discount" && typeof msgMeta.approvedPercent === "number") {
            resolvedFromMessage = clampDiscountPercent(msgMeta.approvedPercent);
          } else {
            resolvedFromMessage = parseDiscountPercentFromText(latestAdminApprovalPercent.content);
          }
        }

        const hasDiscountEscalation = conversation.messages.some(
          (message) =>
            message.role === MessageRole.SYSTEM &&
            /escalated to human/i.test(message.content) &&
            /discount/i.test(message.content),
        );

        const DEFAULT_ALLOCATED_PERCENT = 20;
        appliedDiscountPercent =
          metadataPercent ??
          resolvedFromMessage ??
          (hasDiscountEscalation ? DEFAULT_ALLOCATED_PERCENT : 0);
      }
    }

    const discountTotal = asMoney(subtotal * (appliedDiscountPercent / 100));
    const total = asMoney(subtotal + tax + shippingFee - discountTotal);

    return prisma.$transaction(async (tx) => {
      const db = tx as typeof prisma;

      const shippingAddress = await db.orderAddress.create({
        data: input.shippingAddress,
      });

      const billingAddress = await db.orderAddress.create({
        data: input.billingAddress ?? input.shippingAddress,
      });

      const discountNote =
        appliedDiscountPercent > 0
          ? `Discount applied: ${appliedDiscountPercent}% ($${discountTotal.toFixed(2)}).`
          : null;

      const order = await db.order.create({
        data: {
          orderNumber: createOrderNumber(),
          userId: cart.userId,
          cartId: cart.id,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shipmentStatus: ShipmentStatus.PREPARING,
          subtotal,
          tax,
          shippingFee,
          discountTotal,
          total,
          currency: cart.currency,
          notes: [input.notes?.trim(), discountNote].filter(Boolean).join(" ") || undefined,
          shippingAddressId: shippingAddress.id,
          billingAddressId: billingAddress.id,
          items: {
            create: cartItems.map((item) => ({
              variantId: item.variantId,
              productName: item.variant.product.name,
              variantName: item.variant.label,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              currency: cart.currency,
              imageUrl: item.variant.product.heroImage,
            })),
          },
          statusEvents: {
            create: {
              status: OrderStatus.PENDING,
              note: "Order created from cart checkout.",
              createdById: userId,
            },
          },
        },
        include: {
          items: true,
          payments: true,
          shipments: true,
          statusEvents: { orderBy: { createdAt: "desc" } },
        },
      });

      for (const item of cartItems) {
        const inventory = item.variant.inventory;
        if (!inventory) {
          throw new AppError("Inventory record missing for variant.", 500, "INVENTORY_NOT_FOUND");
        }

        await db.inventoryLevel.update({
          where: { id: inventory.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        await db.inventoryTransaction.create({
          data: {
            inventoryLevelId: inventory.id,
            variantId: item.variantId,
            quantity: -item.quantity,
            reason: InventoryReason.ORDER_FULFILLED,
            reference: `ORDER:${order.id}`,
            createdById: userId,
          },
        });
      }

      await db.cart.update({
        where: { id: cart.id },
        data: {
          status: CartStatus.CHECKED_OUT,
        },
      });

      return order;
    });
  }

  static async getOrdersForUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" } },
        statusEvents: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { placedAt: "desc" },
    });
  }

  static async getOrderById(orderId: string, userId: string | undefined, role: UserRole | undefined) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" } },
        shipments: {
          include: {
            events: { orderBy: { occurredAt: "desc" } },
          },
        },
        statusEvents: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
    }

    if (role !== UserRole.ADMIN && order.userId && order.userId !== userId) {
      throw new AppError("Cannot access another user's order.", 403, "FORBIDDEN");
    }

    return order;
  }

  static async updateOrderStatus(orderId: string, adminUserId: string, input: UpdateOrderStatusInput) {
    await this.getOrderById(orderId, adminUserId, UserRole.ADMIN);

    return prisma.$transaction(async (tx) => {
      const db = tx as typeof prisma;

      const updateData: {
        status: UpdateOrderStatusInput["status"];
        shipmentStatus?: ShipmentStatus;
      } = {
        status: input.status,
      };

      if (input.status === OrderStatus.OUT_FOR_DELIVERY) {
        updateData.shipmentStatus = ShipmentStatus.SHIPPED;
      }

      if (input.status === OrderStatus.DELIVERED) {
        updateData.shipmentStatus = ShipmentStatus.DELIVERED;
      }

      const order = await db.order.update({
        where: { id: orderId },
        data: updateData,
      });

      await db.orderStatusEvent.create({
        data: {
          orderId,
          status: input.status,
          note: input.note,
          createdById: adminUserId,
        },
      });

      return order;
    });
  }
}
